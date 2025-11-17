# Documentation Index

**Site Automation Platform** - Complete documentation reference

---

## 📚 Core Documentation (3 Essential Files)

### 1. **[CLAUDE.md](../CLAUDE.md)** - Developer Guide
**Primary reference for working with this codebase**

- ✅ Development commands (frontend, backend, testing)
- ✅ Page workflows and detailed implementation
- ✅ Database schema reference
- ✅ API endpoints documentation
- ✅ Development patterns & best practices
- ✅ Naming conventions & code standards
- ✅ Troubleshooting guides

**Use this for**: Day-to-day development, adding features, understanding page logic

---

### 2. **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - System Architecture
**Visual system overview with diagrams**

- ✅ Complete system architecture (ASCII diagrams)
- ✅ Frontend/backend structure
- ✅ Data flow for all 5 pages
- ✅ Database schema overview
- ✅ Security architecture
- ✅ Performance metrics
- ✅ Deployment architecture

**Use this for**: Understanding system design, onboarding new developers, architectural decisions

---

### 3. **[ARCHITECTURE_AUDIT_2025_10_15.md](ARCHITECTURE_AUDIT_2025_10_15.md)** - Quality Audit & Roadmap
**Code quality analysis and improvement plan**

- ✅ Current grade: B+ (83/100)
- ✅ Target grade: A (95/100)
- ✅ 25 specific recommendations
- ✅ 3-phase implementation roadmap
- ✅ Quick wins checklist (6/6 completed)
- ✅ Critical issues identified

**Use this for**: Planning improvements, prioritizing technical debt, code reviews

---

## 🗄️ Supporting Documentation

### Database Schema
- **[GTB_NORMALIZED_SCHEMA.md](GTB_NORMALIZED_SCHEMA.md)** - GTB module tables documentation
  - Detailed schema for Page 5 (GTB Configuration)
  - Migration guides and examples

### Legacy/Archive
- **[old-design/](old-design/)** - Historical design documents (archived)
  - Not needed for current development
  - Kept for reference only

---

## 🎯 Quick Reference

### For New Developers
**Read in this order**:
1. [README.md](../README.md) - Project overview & quick start
2. [CLAUDE.md](../CLAUDE.md) - Development guide
3. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - System architecture

### For Existing Developers
**Most used references**:
1. [CLAUDE.md](../CLAUDE.md) - Development patterns & workflows
2. [GTB_NORMALIZED_SCHEMA.md](GTB_NORMALIZED_SCHEMA.md) - Database reference

### For Planning/Management
**Strategic documents**:
1. [ARCHITECTURE_AUDIT_2025_10_15.md](ARCHITECTURE_AUDIT_2025_10_15.md) - Quality roadmap
2. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - System capabilities

---

## 📊 Documentation Maintenance

### Update Frequency
- **README.md**: Update on major changes
- **CLAUDE.md**: Update when adding features or changing workflows
- **ARCHITECTURE_DIAGRAM.md**: Update on architecture changes
- **ARCHITECTURE_AUDIT**: Create new version after major refactors

### Adding New Documentation
**Before creating new docs, ask**:
1. Can this be added to CLAUDE.md instead?
2. Is this architectural? → Add to ARCHITECTURE_DIAGRAM.md
3. Is this temporary? → Use inline code comments instead

**Principle**: Keep documentation minimal but comprehensive. 3 core docs should cover 95% of needs.

---

## 🔍 Finding Information

| I want to... | Check this file |
|--------------|----------------|
| Start development | [README.md](../README.md) |
| Understand a page workflow | [CLAUDE.md](../CLAUDE.md) → Page Workflows section |
| Know which API endpoint to use | [CLAUDE.md](../CLAUDE.md) → API Endpoints section |
| See database schema | [CLAUDE.md](../CLAUDE.md) → Database Schema + [GTB_NORMALIZED_SCHEMA.md](GTB_NORMALIZED_SCHEMA.md) |
| Understand data flow | [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) → Data Flow section |
| Plan improvements | [ARCHITECTURE_AUDIT_2025_10_15.md](ARCHITECTURE_AUDIT_2025_10_15.md) |
| Follow naming conventions | [CLAUDE.md](../CLAUDE.md) → Naming Conventions section |
| Run tests | [CLAUDE.md](../CLAUDE.md) → Testing Commands section |

---

**Last Updated**: October 15, 2025
**Maintained By**: Development Team
