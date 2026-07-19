# Documentation Assets

Use this directory for documentation images or reusable diagram sources that cannot reasonably remain inline.

```text
assets/
├── diagrams/
└── images/
```

Guidelines:

- Prefer Mermaid inside the relevant Markdown document for architecture, flow, and ER diagrams.
- Store editable source beside exported diagrams when a non-Mermaid tool is required.
- Use descriptive lowercase filenames with hyphens.
- Optimize images before committing.
- Do not include real user data, full addresses, tokens, check-in codes, or production screenshots containing private information.
- Add meaningful alt text where the image is embedded.
- Remove obsolete assets in the same change that removes their references.
