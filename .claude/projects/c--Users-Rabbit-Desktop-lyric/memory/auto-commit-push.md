---
name: auto-commit-push
description: 每次代码改动后自动提交到 GitHub 并附说明
metadata:
  type: feedback
---

每次代码改动完成后，自动执行 `git add -A && git commit -m "<描述>" && git push`，不需要用户手动催促。

**Why:** 用户希望每次改动都有版本记录，避免丢失进度。

**How to apply:** 完成任何代码修改后（创建、编辑、删除文件），在汇报结果之前先构建验证（tsc + vite build），然后自动 commit + push。commit message 用中文或英文描述改动内容。
