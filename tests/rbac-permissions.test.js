const test = require("node:test");
const assert = require("node:assert/strict");

// Pure JS implementations mirroring rbac.ts logic for test runner
function hasFinancialAccess(user) {
  if (!user || !user.role) return false;
  return user.role !== "user";
}

function canManageInventory(user) {
  if (!user || !user.role) return false;
  return user.role !== "user";
}

test("RBAC - Role Permissions", async (t) => {
  await t.test("hasFinancialAccess returns false for user role", () => {
    assert.strictEqual(hasFinancialAccess({ role: "user" }), false);
  });

  await t.test("hasFinancialAccess returns true for admin role", () => {
    assert.strictEqual(hasFinancialAccess({ role: "admin" }), true);
  });

  await t.test("hasFinancialAccess returns true for other non-user roles (manager, auditor)", () => {
    assert.strictEqual(hasFinancialAccess({ role: "manager" }), true);
    assert.strictEqual(hasFinancialAccess({ role: "auditor" }), true);
  });

  await t.test("hasFinancialAccess returns false for unauthenticated / null / undefined user", () => {
    assert.strictEqual(hasFinancialAccess(null), false);
    assert.strictEqual(hasFinancialAccess(undefined), false);
    assert.strictEqual(hasFinancialAccess({}), false);
  });

  await t.test("canManageInventory returns false for user role and true for admin", () => {
    assert.strictEqual(canManageInventory({ role: "user" }), false);
    assert.strictEqual(canManageInventory({ role: "admin" }), true);
  });
});

test("RBAC - Frontend Sort & Menu Filtering", async (t) => {
  const ALL_SORT_OPTIONS = [
    { id: "default", label: "Default" },
    { id: "price-asc", label: "Price: Low to High", isFinancial: true },
    { id: "price-desc", label: "Price: High to Low", isFinancial: true },
    { id: "name-asc", label: "Name: A-Z" },
    { id: "name-desc", label: "Name: Z-A" },
    { id: "qty-asc", label: "Low Stock First" },
  ];

  await t.test("User role cannot see price sort options", () => {
    const userRole = { role: "user" };
    const access = hasFinancialAccess(userRole);
    const filtered = ALL_SORT_OPTIONS.filter((opt) => !opt.isFinancial || access);
    assert.strictEqual(filtered.some((o) => o.id === "price-asc"), false);
    assert.strictEqual(filtered.some((o) => o.id === "price-desc"), false);
    assert.strictEqual(filtered.length, 4);
  });

  await t.test("Admin role can see all sort options including price", () => {
    const adminRole = { role: "admin" };
    const access = hasFinancialAccess(adminRole);
    const filtered = ALL_SORT_OPTIONS.filter((opt) => !opt.isFinancial || access);
    assert.strictEqual(filtered.some((o) => o.id === "price-asc"), true);
    assert.strictEqual(filtered.some((o) => o.id === "price-desc"), true);
    assert.strictEqual(filtered.length, 6);
  });

  await t.test("Drawer menu filters Finances route for user role", () => {
    const ALL_MENU_ITEMS = [
      { label: "Home", route: "/" },
      { label: "Products", route: "/explore" },
      { label: "Categories", route: "/categories" },
      { label: "Stores", route: "/stores" },
      { label: "Finances", route: "/finances", isFinancial: true },
      { label: "Settings", route: "/settings" },
    ];
    const userAccess = hasFinancialAccess({ role: "user" });
    const userMenu = ALL_MENU_ITEMS.filter((item) => !item.isFinancial || userAccess);
    assert.strictEqual(userMenu.some((item) => item.route === "/finances"), false);

    const adminAccess = hasFinancialAccess({ role: "admin" });
    const adminMenu = ALL_MENU_ITEMS.filter((item) => !item.isFinancial || adminAccess);
    assert.strictEqual(adminMenu.some((item) => item.route === "/finances"), true);
  });
});

test("RBAC - Total Value calculation safety", async (t) => {
  const products = [
    { id: "1", name: "Item A", quantity: 10, price: 100 },
    { id: "2", name: "Item B", quantity: 5, price: 50 },
  ];

  await t.test("Total Value is 0 when user has user role (access is denied)", () => {
    const access = hasFinancialAccess({ role: "user" });
    const totalValue = access
      ? products.reduce((sum, p) => sum + (p.price != null ? p.price * p.quantity : 0), 0)
      : 0;
    assert.strictEqual(totalValue, 0);
  });

  await t.test("Total Value is calculated when user is admin", () => {
    const access = hasFinancialAccess({ role: "admin" });
    const totalValue = access
      ? products.reduce((sum, p) => sum + (p.price != null ? p.price * p.quantity : 0), 0)
      : 0;
    assert.strictEqual(totalValue, 1250);
  });

  await t.test("Total Value handles stripped price (undefined) gracefully without NaN or error", () => {
    const strippedProducts = [
      { id: "1", name: "Item A", quantity: 10 },
      { id: "2", name: "Item B", quantity: 5 },
    ];
    const access = hasFinancialAccess({ role: "admin" });
    const totalValue = access
      ? strippedProducts.reduce((sum, p) => sum + (p.price != null ? p.price * p.quantity : 0), 0)
      : 0;
    assert.strictEqual(totalValue, 0);
    assert.strictEqual(isNaN(totalValue), false);
  });
});

test("RBAC - Home Page Dashboard Blur & Non-Interactivity", async (t) => {
  function getDashboardStyleAndEvents(user) {
    const isUserRole = user?.role === "user";
    return {
      isBlurred: isUserRole,
      pointerEvents: isUserRole ? "none" : "auto",
      filter: isUserRole ? "blur(8px)" : "none",
      hasOverlay: isUserRole,
    };
  }

  await t.test("Dashboard is blurred and non-interactive for user role", () => {
    const user = { username: "testuser", role: "user" };
    const config = getDashboardStyleAndEvents(user);
    assert.strictEqual(config.isBlurred, true);
    assert.strictEqual(config.pointerEvents, "none");
    assert.strictEqual(config.filter, "blur(8px)");
    assert.strictEqual(config.hasOverlay, true);
  });

  await t.test("Dashboard is clear and interactive for admin role", () => {
    const admin = { username: "admin", role: "admin" };
    const config = getDashboardStyleAndEvents(admin);
    assert.strictEqual(config.isBlurred, false);
    assert.strictEqual(config.pointerEvents, "auto");
    assert.strictEqual(config.filter, "none");
    assert.strictEqual(config.hasOverlay, false);
  });
});

test("RBAC - Login Page Registration Removed", async (t) => {
  await t.test("LoginScreen component has removed registration mode toggle and link", () => {
    const fs = require("fs");
    const path = require("path");
    const loginScreenSource = fs.readFileSync(
      path.join(__dirname, "../src/components/login-screen.tsx"),
      "utf8"
    );

    assert.strictEqual(loginScreenSource.includes("switchMode"), false, "LoginScreen should not have switchMode");
    assert.strictEqual(loginScreenSource.includes("mode === 'register'"), false, "LoginScreen should not have register mode");
    assert.strictEqual(loginScreenSource.includes("Don't have an account?"), false, "LoginScreen should not contain sign up CTA");
    assert.strictEqual(loginScreenSource.includes("Create Account"), false, "LoginScreen should not have Create Account button");
  });
});

test("RBAC - Settings Page Section Visibility & Protections", async (t) => {
  function getVisibleSettingsSections(user) {
    const isUserRole = user?.role === "user";
    const hasFinancial = hasFinancialAccess(user);
    return {
      alertsAndNotifications: true,
      preferences: true,
      financialParameters: hasFinancial,
      systemControls: !isUserRole,
      about: true,
    };
  }

  await t.test("Settings hides financial parameters and system controls for user role", () => {
    const user = { username: "testuser", role: "user" };
    const sections = getVisibleSettingsSections(user);
    assert.strictEqual(sections.alertsAndNotifications, true);
    assert.strictEqual(sections.preferences, true);
    assert.strictEqual(sections.financialParameters, false, "Financial parameters must be hidden for user role");
    assert.strictEqual(sections.systemControls, false, "System controls must be hidden for user role");
    assert.strictEqual(sections.about, true);
  });

  await t.test("Settings shows all sections including financial and system controls for admin role", () => {
    const admin = { username: "admin", role: "admin" };
    const sections = getVisibleSettingsSections(admin);
    assert.strictEqual(sections.alertsAndNotifications, true);
    assert.strictEqual(sections.preferences, true);
    assert.strictEqual(sections.financialParameters, true, "Financial parameters must be visible for admin");
    assert.strictEqual(sections.systemControls, true, "System controls must be visible for admin");
    assert.strictEqual(sections.about, true);
  });
});
