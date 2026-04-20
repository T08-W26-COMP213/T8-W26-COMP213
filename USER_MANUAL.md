# StockGuard — End-User Manual (Draft)

*Add screenshots and step numbers where noted. Copy this content into **Appendix C** of your final report if required.*

## 1. Introduction

- **Purpose of StockGuard:** _(short paragraph: who uses it and what problem it solves)_
- **Audience:** Operational staff, business owners / analysts, system administrators _(adjust to your roles)_

## 2. Getting Started

- **URL / how to open the app:** _(e.g. local dev URL or deployed URL)_
- **Supported browsers:** _(e.g. Chrome, Edge — list what you tested)_

## 3. Sign In and Account

- How to **sign in** (email + password)
- **First-time password** / **forgot password** _(if your build includes these flows — describe each)_
- **Sign out** (logout)
- **Session behavior:** _(e.g. closing the browser tab may require signing in again — align with your actual app)_

## 4. Main Navigation (Sidebar)


- [ ] Dashboard
- [ ] Inventory
- [ ] Log Usage _(if applicable)_
- [ ] Risk Alerts
- [ ] Consumption Trends _(if applicable)_
- [ ] User Management _(admin only — note)_
- [ ] Reports
- [ ] System Settings _(admin — note)_
- [ ] System Monitoring _(if applicable)_

## 5. Dashboard

- What the **summary cards** mean (totals, at risk, critical)
- **Inventory Overview** table: Stock, Threshold, Risk
- **Refresh Data:** recalculates risk from current rules _(describe in one sentence)_
- **Risk distribution** chart _(if present)_

## 6. Inventory Management

- **Add** a new item _(name, stock, threshold)_
- **Edit** / **Delete** an item
- **Duplicate item** flow _(merge vs replace — if your UI has this)_

## 7. Logging Inventory Usage

- Selecting an item and entering **quantity** and **date**
- What happens after a successful log _(stock updates, risk may update)_

## 8. Risk Alerts and Trends

- How to read **Safe / At Risk / Critical**
- Where to adjust **risk threshold percentages** _(admin: System Settings — Risk Threshold Settings)_

## 9. Reports and Exports

- How to choose a report and filters
- **Export CSV / PDF** _(where the buttons are and what files are produced)_

## 10. User Management (Administrators)

- Add / edit / deactivate users _(only what a classroom admin would do — no internal API secrets)_

## 11. System Settings and Monitoring (Administrators)

- **System configuration** _(high-level: what admins can change)_
- **Monitoring / logs** view _(what it is for)_

## 12. Troubleshooting (End Users)

| Problem | What to try |
|--------|-------------|
| Cannot sign in | _(your checklist)_ |
| Data looks outdated | _(e.g. use Refresh Data on dashboard)_ |
| Error message on save | _(generic guidance)_ |

## 13. Glossary _(optional)_

- **Reorder threshold:** _(your definition)_
- **Risk levels:** _(your definitions aligned with the UI labels)_

---


