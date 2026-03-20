// controllers/adminController.js
const jwt      = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Company  = require('../models/Company');
const User     = require('../models/User');
const generateCompanyCode       = require('../utils/generateCompanyCode');
const { generateUsername, generateTempPassword } = require('../utils/generateCredentials');
const { sendCredentialsEmail }  = require('../services/emailService');

const signAdminToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET, {
    expiresIn: '8h',
    issuer:    'printmixbox-admin',
    audience:  'printmixbox-admin-panel',
  });

// ── POST /api/admin/auth/login ────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required.' });

    const admin = await AdminUser.findOne({
      username: username.toLowerCase().trim(),
      isActive: true,
    }).select('+passwordHash');

    if (!admin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

    const valid = await admin.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = signAdminToken({
      adminId:  admin._id.toString(),
      username: admin.username,
      role:     admin.role,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role },
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/companies ──────────────────────────────────────────────────
// List all companies with optional status filter
const getCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search = '' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { gstNumber:   { $regex: search, $options: 'i' } },
        { companyCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [companies, total] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Company.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error('getCompanies error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/companies/:id ──────────────────────────────────────────────
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    const users = await User.find({ companyId: company._id }).select('-passwordHash');
    return res.status(200).json({ success: true, data: { company, users } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/admin/companies/:id/approve ─────────────────────────────────────
// Approve a company: generate code, create user, email credentials
const approveCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    if (company.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Company is already approved.' });
    }

    // 1. Generate company code
    const companyCode = await generateCompanyCode();

    // 2. Generate credentials
    const baseUsername   = generateUsername(company.companyName);
    const tempPassword   = generateTempPassword();

    // Ensure username is unique (add suffix if needed)
    let username = baseUsername;
    let attempt  = 0;
    while (true) {
      const existing = await User.findOne({ username });
      if (!existing) break;
      attempt++;
      username = `${baseUsername}${attempt}`;
    }

    // 3. Hash password
    const passwordHash = await User.hashPassword(tempPassword);

    // 4. Update company
    company.companyCode       = companyCode;
    company.status            = 'approved';
    company.isVerified        = true;
    company.credentialsSentAt = new Date();
    company.adminNote         = req.body.note || '';
    await company.save();

    // 5. Create owner user
    await User.create({
      companyId:           company._id,
      username,
      email:               company.email,
      passwordHash,
      role:                'owner',
      isTemporaryPassword: true,
    });

    // 6. Send credentials email
    try {
      await sendCredentialsEmail({
        to:           company.email,
        companyName:  company.companyName,
        companyCode,
        username,
        tempPassword,
      });
    } catch (emailErr) {
      console.error('Credentials email failed:', emailErr.message);
      // Don't fail the approval — admin can resend
    }

    return res.status(200).json({
      success: true,
      message: `Company approved and credentials sent to ${company.email}`,
      data: {
        company: {
          id:          company._id,
          companyName: company.companyName,
          companyCode: company.companyCode,
          status:      company.status,
          email:       company.email,
        },
        credentials: {
          username,
          // Only show in dev for testing
          ...(process.env.NODE_ENV === 'development' ? { tempPassword } : {}),
        },
      },
    });
  } catch (err) {
    console.error('approveCompany error:', err);
    return res.status(500).json({ success: false, message: 'Server error during approval.' });
  }
};

// ── POST /api/admin/companies/:id/reject ──────────────────────────────────────
const rejectCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    if (company.status === 'approved') return res.status(400).json({ success: false, message: 'Cannot reject an already approved company.' });

    company.status    = 'rejected';
    company.adminNote = req.body.reason || '';
    await company.save();

    return res.status(200).json({ success: true, message: 'Company rejected.', data: { company } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/admin/companies/:id/resend-credentials ──────────────────────────
const resendCredentials = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    if (company.status !== 'approved') return res.status(400).json({ success: false, message: 'Company is not approved yet.' });

    const user = await User.findOne({ companyId: company._id, role: 'owner' }).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'Company user not found.' });

    // Generate a fresh temp password
    const tempPassword = generateTempPassword();
    user.passwordHash        = await User.hashPassword(tempPassword);
    user.isTemporaryPassword = true;
    await user.save({ validateBeforeSave: false });

    await sendCredentialsEmail({
      to:          company.email,
      companyName: company.companyName,
      companyCode: company.companyCode,
      username:    user.username,
      tempPassword,
    });

    company.credentialsSentAt = new Date();
    await company.save();

    return res.status(200).json({
      success: true,
      message: `New credentials sent to ${company.email}`,
      ...(process.env.NODE_ENV === 'development' ? { debug: { tempPassword } } : {}),
    });
  } catch (err) {
    console.error('resendCredentials error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'pending' }),
      Company.countDocuments({ status: 'approved' }),
      Company.countDocuments({ status: 'rejected' }),
    ]);

    const recentRegistrations = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('companyName email status createdAt');

    return res.status(200).json({
      success: true,
      data: {
        stats: { total, pending, approved, rejected },
        recentRegistrations,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/me ─────────────────────────────────────────────────────────
const getAdminMe = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin.adminId);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
    return res.status(200).json({ success: true, data: { admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role } } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  adminLogin,
  getCompanies,
  getCompanyById,
  approveCompany,
  rejectCompany,
  resendCredentials,
  getStats,
  getAdminMe,
};