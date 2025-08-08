# README Generator Configuration

This project includes `readme-generator` configuration for potential future automation of README updates. However, due to the highly customized nature of this MCP template's documentation, the README is currently maintained manually.

## Configuration Details

- **Config file**: `.readme/configs/readme-config.yaml`
- **Status**: Configured but automation disabled (`smart_updates: false`)
- **Reason**: Manual README provides better structure and MCP-specific content

## Future Enhancement

The `readme-generator` could potentially be used for:
- Automated badge updates
- Basic metadata management
- Standard section formatting

However, the current manual approach ensures:
- Complete control over MCP server documentation
- Custom usage examples and integration patterns
- Detailed technical explanations specific to MCP ecosystem

## Usage

To test README generation (will overwrite current README):
```bash
readme-generator generate
```

To restore the comprehensive manual README:
```bash
git restore README.md
```

**Recommendation**: Keep manual README maintenance for this specialized template.