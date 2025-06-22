# 🤝 Contributing Guide

Thank you for considering contributing to easyelastic! 🎉  
We welcome all kinds of contributions — from bug reports and feature requests to documentation improvements and code enhancements.

Please take a moment to read these guidelines to make the process easier for everyone.

---

## 🌿 Branch Naming Convention

To keep our repository clean and easy to navigate, please follow this branch naming pattern:


type/issue-number/short-description

### 🔤 Examples
- `feature/101-add-user-authentication`
- `fix/204-navbar-overflow`
- `docs/312-update-readme-guide`

### 🧩 Types
| Type      | Purpose                                  |
|-----------|------------------------------------------|
| `docs`    | Documentation only changes               |
| `feature` | A new feature                            |
| `fix`     | A bug fix                                |
| `refactor`| Code changes that neither fix nor add    |
| `test`    | Adding or improving tests                |

> 💡 Use kebab-case for clarity (e.g. `fix/147-login-button-bug`)

---

## ✅ Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification to maintain a clean, semantic commit history.

### 🔠 Structure

type: description #issue-number


### ✅ Good Examples
- `feature: add Google login integration #101`
- `fix: resolve mobile menu toggle issue #204`

### ❌ Bad Examples
- `updated login` ❌
- `fixing bugs` ❌
- `commit for issue` ❌

### 💡 Tips
- Keep your messages short and descriptive.
- Use present tense: "add feature", not "added feature".
- Always include the related issue number (`#123`).

---

## 🚀 Pull Request Process

1. **Fork** the repository and create a new branch using the naming convention above.
2. **Make your changes**, ensuring you follow code style and include tests where appropriate.
3. **Commit** using the Conventional Commit format.
4. **Push** your branch and open a pull request to the `main` or `dev` branch.
5. **Describe** your PR clearly and mention the issue it resolves:
