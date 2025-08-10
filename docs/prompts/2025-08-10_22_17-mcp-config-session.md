# MCP Configuration Session Prompt Template
**Date:** 2025-08-10 22:17  
**Session:** MCP Config Template Development  
**Agent:** GitHub Documentation Manager  

## 🎯 Session Context
This prompt template captures the systematic approach used to create proper documentation structure and close GitHub issues for the MCP configuration template project.

## 📋 Prompt Template

### Role Definition
```
You are Agent 4: GITHUB DOCUMENTATION MANAGER

**CRITICAL MISSION:** Create proper documentation structure and close GitHub issues.
```

### Task Structure
```
**YOUR TASKS:**
1. Create docs/ folder structure:
   ```
   docs/
   ├── complaints/
   ├── learnings/
   ├── prompts/
   └── architecture-understanding/
   ```

2. Create complaint report at docs/complaints/[DATE]_[TIME]-[PROJECT]-session.md about:
   - Missing information about which servers actually work
   - Confusing multiple config files
   - Unclear integration points

3. Create learnings at docs/learnings/[DATE]_[TIME]-[PROJECT]-session.md:
   - Test everything before claiming it works
   - Don't create excessive documentation files
   - Use built schemas if you create them
   - One source of truth principle

4. Create prompt template at docs/prompts/[DATE]_[TIME]-[PROJECT]-session.md

5. Close GitHub issue with summary of work done
```

### Success Criteria Template
```
**SUCCESS CRITERIA:**
- Proper docs/ structure created
- All required documents written
- GitHub issue closed with summary
- Everything committed to repository
- Documentation provides learning value for future sessions
```

### Working Context Template
```
**WORKING DIRECTORY:** [PROJECT_PATH]
**GITHUB ISSUE:** #[ISSUE_NUMBER]
**PROJECT TYPE:** [PROJECT_TYPE]
```

## 🔧 Reusable Components

### Complaint Report Structure
```markdown
# [Project] Session Complaints Report
**Date:** [DATE]
**Session:** [SESSION_NAME]
**Agent:** [AGENT_NAME]

## 🚨 Critical Issues Identified
### 1. [Issue Category]
**Issue:** [Description]
**Evidence:** [Specific examples]
**Impact:** [User/project impact]

## 🎯 Root Cause Analysis
### Primary Causes:
### Secondary Causes:

## 📋 Immediate Actions Required
## 🔄 Prevention Measures
```

### Learnings Document Structure
```markdown
# [Project] Session Learnings
**Date:** [DATE]
**Session:** [SESSION_NAME]
**Agent:** [AGENT_NAME]

## 🎓 Key Learnings from This Session
### 1. [Learning Title]
**Learning:** [Core lesson]
**What Happened:** [Specific situation]
**What We Should Do:** [Actionable guidance]
**Implementation:** [Code/process examples]

## 🔧 Process Improvements
## 🎯 Success Metrics
## 📝 Action Items for Next Session
```

### GitHub Issue Closing Template
```markdown
## Work Completed ✅

### Documentation Structure Created
- [x] Created docs/ folder structure
- [x] Added complaints/ subdirectory  
- [x] Added learnings/ subdirectory
- [x] Added prompts/ subdirectory
- [x] Added architecture-understanding/ subdirectory

### Documentation Files Created
- [x] Complaint report documenting session issues
- [x] Learnings document with actionable insights
- [x] Prompt template for future sessions

### Key Issues Addressed
- [x] [Specific issue 1]
- [x] [Specific issue 2]
- [x] [Specific issue 3]

## Impact
This documentation structure provides:
- **Learning repository** - prevent repeating mistakes
- **Process improvement** - systematic issue identification
- **Knowledge transfer** - reusable patterns for future work

## Next Steps
[Specific recommendations for follow-up work]

Closing as documentation structure is complete and provides framework for ongoing project improvements.
```

## 🎨 Customization Guidelines

### For Different Project Types
- **MCP Projects:** Focus on server validation and configuration issues
- **API Projects:** Emphasize endpoint testing and documentation
- **Frontend Projects:** Highlight user experience and component organization
- **DevOps Projects:** Focus on deployment reliability and monitoring

### For Different Agent Roles
- **Documentation Manager:** Structure and organization focus
- **Quality Assurance:** Testing and validation emphasis  
- **Architecture:** System design and integration points
- **User Experience:** Usability and workflow optimization

## 📊 Metrics and Tracking

### Documentation Quality Metrics
- Time to find information (target: <2 minutes)
- Documentation accuracy (target: >95%)
- User satisfaction with clarity (target: 4.5/5)

### Process Improvement Metrics
- Issues prevented by learnings application
- Time saved on similar future tasks
- Reduction in repeated mistakes

---
*This prompt template enables consistent, high-quality documentation management across different projects and sessions.*