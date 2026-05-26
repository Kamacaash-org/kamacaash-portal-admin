import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../config";
import useAuthUser from "../Components/Hooks/useAuthUser";
import {
  getAllowedPathsForRole,
  isPathAllowedForRole,
} from "../helpers/permissions";
const Navdata = () => {
  const history = useNavigate();
  const location = useLocation();

  const authUserSession = JSON.parse(sessionStorage.getItem("authUser"));
  const authUser = useAuthUser();
  const userId = authUserSession?.data?.user?._id;
  const userRole = authUser?.role || authUserSession?.data?.user?.role || "";
  const isSuperAdmin = userId === "superadmin-id";
  const [iscurrentState, setIscurrentState] = useState("Dashboard");
  const [retreivedMenus, setRetreivedMenus] = useState([]);
  const [menuStates, setMenuStates] = useState({}); // dynamic toggle states

  function updateIconSidebar(e) {
    if (e?.target?.getAttribute("subitems")) {
      const ul = document.getElementById("two-column-menu");
      const iconItems = ul?.querySelectorAll(".nav-icon.active") || [];
      [...iconItems].forEach((item) => {
        item.classList.remove("active");
        const id = item.getAttribute("subitems");
        const el = document.getElementById(id);
        if (el) el.classList.remove("show");
      });
    }
  }
  // Function to collect all permitted paths from menus
  const getAllPermittedPaths = (menus) => {
    const paths = [];
    menus.forEach((menu) => {
      if (menu.link && menu.link !== "/#") paths.push(menu.link);
      if (menu.subItems) {
        menu.subItems.forEach((sub) => {
          paths.push(sub.link);
        });
      }
    });
    return paths;
  };

  // Reset state variables on current state change
  useEffect(() => {
    setMenuStates((prevStates) => {
      const newStates = {};
      Object.keys(prevStates).forEach((key) => {
        newStates[key] = key === iscurrentState;
      });
      return newStates;
    });
  }, [iscurrentState]);

  // console.log("current state is:", iscurrentState)

  // Fetch dynamic menu if not superadmin
  // useEffect(() => {
  //   const fetchDynamicMenu = async () => {
  //     try {

  //       const response = await fetch(`${api.API_URL}/users/${userId}/menu`);
  //       const data = await response.json();
  //       setRetreivedMenus(data.flatMenu);
  //     } catch (err) {
  //       console.error("Error fetching user menu:", err);
  //     }
  //   };

  //   if (userId && userId !== "superadmin-id") {
  //     fetchDynamicMenu();
  //   }
  // }, [userId]);

  // Check route permission
  useEffect(() => {
    const roleAllowedPaths = getAllowedPathsForRole(userRole);

    if (roleAllowedPaths) {
      const currentPath = location.pathname;

      if (!isPathAllowedForRole(userRole, currentPath)) {
        history("/offers");
      }
      return;
    }

    if (!isSuperAdmin && retreivedMenus.length > 0) {
      const permittedPaths = getAllPermittedPaths(retreivedMenus);
      const currentPath = location.pathname;

      // Allow access to root or not-found page
      if (currentPath === "/" || currentPath === "/not-found") return;

      // Check if current path or any parent path is permitted
      const isPermitted = permittedPaths.some((path) => {
        return (
          currentPath.startsWith(path) ||
          (path !== "/dashboard" && currentPath.includes(path))
        );
      });

      if (!isPermitted) {
        history("/not-found");
      }
    }
  }, [location.pathname, retreivedMenus, isSuperAdmin, history, userRole]);

  // Static full-access menu for superadmin
  const menuItems = [
    {
      id: "DASHBOARD",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/dashboard",
    },

    {
      id: "BUSINESS",
      label: "Business",
      icon: "ri-store-2-line",
      link: "/#",
      stateVariables: menuStates["BUSINESS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, BUSINESS: !prev.BUSINESS }));
        setIscurrentState("BUSINESS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "BusinessCategories",
          label: "Categories",
          link: "/business/categories",
          parentId: "BUSINESS",
        },
        {
          id: "Businesses",
          label: "Businesses",
          link: "/business/list",
          parentId: "BUSINESS",
        },
        {
          id: "BusinessApproval",
          label: "Approval",
          link: "/business/approval",
          parentId: "BUSINESS",
        },
        {
          id: "Contracts",
          label: "Contracts",
          link: "/business/contracts",
          parentId: "BUSINESS",
        },
        // {
        //   id: "UploadContract",
        //   label: "Upload Contract",
        //   link: "/business/contracts/upload",
        //   parentId: "BUSINESS",
        // },
      ],
    },

    // ✅ Reviews separated
    // {
    //   id: "REVIEWS",
    //   label: "Reviews",
    //   icon: "ri-star-smile-line",
    //   link: "/#",
    //   stateVariables: menuStates["REVIEWS"] || false,
    //   click: function (e) {
    //     e.preventDefault();
    //     setMenuStates((prev) => ({ ...prev, REVIEWS: !prev.REVIEWS }));
    //     setIscurrentState("REVIEWS");
    //     updateIconSidebar(e);
    //   },
    //   subItems: [
    //     {
    //       id: "BusinessReviews",
    //       label: "All Reviews",
    //       link: "/reviews",
    //       parentId: "REVIEWS",
    //     },
    //     {
    //       id: "ReviewRequests",
    //       label: "Featured Review Requests",
    //       link: "/reviews/feature-requests",
    //       parentId: "REVIEWS",
    //     },
    //     // {
    //     //   id: "Moderation",
    //     //   label: "Moderation",
    //     //   link: "/reviews/moderation",
    //     //   parentId: "REVIEWS",
    //     // },
    //   ],
    // },

    {
      id: "OFFERS_SECTION",
      label: "Offers",
      icon: "ri-price-tag-3-line",
      link: "/#",
      stateVariables: menuStates["OFFERS_SECTION"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({
          ...prev,
          OFFERS_SECTION: !prev.OFFERS_SECTION,
        }));
        setIscurrentState("OFFERS_SECTION");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "Offers",
          label: "Offers",
          link: "/offers",
          parentId: "OFFERS_SECTION",
        },
      ],
    },

    {
      id: "ORDERS",
      label: "Orders",
      icon: "ri-shopping-bag-3-line",
      link: "/#",
      stateVariables: menuStates["ORDERS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, ORDERS: !prev.ORDERS }));
        setIscurrentState("ORDERS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "ManageOrders",
          label: "Manage Orders",
          link: "/orders",
          parentId: "ORDERS",
        },
        {
          id: "OrderHistory",
          label: "Order History",
          link: "/orders/history",
          parentId: "ORDERS",
        },
      ],
    },

    {
      id: "PAYMENTS",
      label: "Payments",
      icon: "ri-bank-card-line",
      link: "/#",
      stateVariables: menuStates["PAYMENTS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, PAYMENTS: !prev.PAYMENTS }));
        setIscurrentState("PAYMENTS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "PaymentDiagnostics",
          label: "Diagnostics",
          link: "/payments/diagnostics",
          parentId: "PAYMENTS",
        },
      ],
    },

    {
      id: "REPORTS",
      label: "Reports",
      icon: "ri-file-chart-line",
      link: "/#",
      stateVariables: menuStates["REPORTS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, REPORTS: !prev.REPORTS }));
        setIscurrentState("REPORTS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "AdminDailyCommission",
          label: "Daily Commission Ledger",
          link: "/reports/admin/commission-daily",
          parentId: "REPORTS",
        },
        {
          id: "AdminWeeklyCommission",
          label: "Weekly Commission Rollup",
          link: "/reports/admin/commission-weekly",
          parentId: "REPORTS",
        },
        {
          id: "AdminMonthlyCommission",
          label: "Monthly Commission Statement",
          link: "/reports/admin/commission-monthly",
          parentId: "REPORTS",
        },
        {
          id: "TopProviders",
          label: "Top Providers",
          link: "/reports/admin/providers",
          parentId: "REPORTS",
        },
        {
          id: "TopCategories",
          label: "Top Categories",
          link: "/reports/admin/categories",
          parentId: "REPORTS",
        },
        {
          id: "TopSavers",
          label: "Top Savers",
          link: "/reports/admin/savers",
          parentId: "REPORTS",
        },
        {
          id: "MostFavorited",
          label: "Most Favorited",
          link: "/reports/admin/favorites",
          parentId: "REPORTS",
        },
        {
          id: "UserGrowth",
          label: "User Growth",
          link: "/reports/admin/user-growth",
          parentId: "REPORTS",
        },
      ],
    },

    {
      id: "USERS",
      label: "Users",
      icon: "ri-team-line",
      link: "/#",
      stateVariables: menuStates["USERS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, USERS: !prev.USERS }));
        setIscurrentState("USERS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "StaffAccounts",
          label: "Staff Accounts",
          link: "/users/staff",
          parentId: "USERS",
        },
      ],
    },

    {
      id: "SETTINGS",
      label: "Settings",
      icon: "ri-settings-3-line",
      link: "/#",
      stateVariables: menuStates["SETTINGS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, SETTINGS: !prev.SETTINGS }));
        setIscurrentState("SETTINGS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "SettingsCountry",
          label: "Country",
          link: "/settings/country",
          parentId: "SETTINGS",
        },
        {
          id: "SettingsCities",
          label: "Cities",
          link: "/settings/cities",
          parentId: "SETTINGS",
        },
      ],
    },
  ];

  const businessOwnerFlatMenu = [
    {
      id: "BO_REPORTS",
      label: "Reports",
      icon: "ri-file-chart-line",
      link: "/#",
      stateVariables: menuStates["BO_REPORTS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, BO_REPORTS: !prev.BO_REPORTS }));
        setIscurrentState("BO_REPORTS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "BODailyLedger",
          label: "Daily Ledger",
          link: "/reports/daily",
          parentId: "BO_REPORTS",
        },
        {
          id: "BOWeeklyRollup",
          label: "Weekly Rollup",
          link: "/reports/weekly",
          parentId: "BO_REPORTS",
        },
        {
          id: "BOMonthlyStatement",
          label: "Monthly Statement",
          link: "/reports/monthly",
          parentId: "BO_REPORTS",
        },
        {
          id: "BOOfferPerformance",
          label: "Offer Performance",
          link: "/reports/performance",
          parentId: "BO_REPORTS",
        },
      ],
    },
    {
      id: "BO_OFFERS",
      label: "Offers",
      icon: "ri-price-tag-3-line",
      link: "/offers",
    },
    {
      id: "BO_MANAGE_ORDERS",
      label: "Manage Orders",
      icon: "ri-shopping-bag-3-line",
      link: "/orders",
    },
    {
      id: "BO_ORDER_HISTORY",
      label: "Order History",
      icon: "ri-history-line",
      link: "/orders/history",
    },
    {
      id: "BO_SETTINGS",
      label: "Settings",
      icon: "ri-store-2-line",
      link: "/business/profile-settings",
    },
    {
      id: "BO_PROFILE",
      label: "Profile",
      icon: "ri-user-line",
      link: "/users/staff-profile",
    },
    // {
    //   id: "BO_CHANGE_PASSWORD",
    //   label: "Change Password",
    //   icon: "ri-lock-password-line",
    //   link: "/auth-change-password",
    // },
  ];

  const visibleMenuItems =
    userRole === "BUSINESS_OWNER"
      ? businessOwnerFlatMenu
      : menuItems;

  // const menuItems = [
  //   {
  //     id: "BUSINESS_MANAGEMENT",
  //     label: "Business Mngmnt",
  //     icon: "ri-apps-2-line",
  //     link: "/#",
  //     stateVariables: menuStates["BUSINESS_MANAGEMENT"] || false,
  //     click: function (e) {
  //       e.preventDefault();
  //       setMenuStates((prev) => ({
  //         ...prev,
  //         BUSINESS_MANAGEMENT: !prev.BUSINESS_MANAGEMENT,
  //       }));
  //       setIscurrentState("BUSINESS_MANAGEMENT");
  //       updateIconSidebar(e);
  //     },
  //     subItems: [
  //       {
  //         id: "Businesses",
  //         label: "Categories",
  //         link: "/business-management/categories",
  //         parentId: "BUSINESS_MANAGEMENT",
  //       },

  //       {
  //         id: "Businesses",
  //         label: "Businesses",
  //         link: "/buiness-management/businsesses",
  //         parentId: "BUSINESS_MANAGEMENT",
  //       },

  //       {
  //         id: "uploadContract",
  //         label: "Upload Contract",
  //         link: "/business-management/upload-contract",
  //         parentId: "BUSINESS_MANAGEMENT",
  //       },

  //       {
  //         id: "approveCusiness",
  //         label: "approve business",
  //         link: "/business-management/approve-business",
  //         parentId: "BUSINESS_MANAGEMENT",
  //       },
  //       {
  //         id: "BusinessReviews",
  //         label: "Reviews",
  //         link: "/business-management/reviews",
  //         parentId: "BUSINESS_MANAGEMENT",
  //       },
  //       {
  //         id: "ReviewRequests",
  //         label: "Review Requests",
  //         link: "/business-management/review-requests",
  //         parentId: "BUSINESS_MANAGEMENT",
  //       },
  //     ],
  //   },

  //   {
  //     id: "CONTENT_MANAGEMENT",
  //     label: "Content Mngmnt",
  //     icon: "ri-apps-2-line",
  //     link: "/#",
  //     stateVariables: menuStates["CONTENT_MANAGEMENT"] || false,
  //     click: function (e) {
  //       e.preventDefault();
  //       setMenuStates((prev) => ({
  //         ...prev,
  //         CONTENT_MANAGEMENT: !prev.CONTENT_MANAGEMENT,
  //       }));
  //       setIscurrentState("CONTENT_MANAGEMENT");
  //       updateIconSidebar(e);
  //     },
  //     subItems: [
  //       {
  //         id: "surplusPackages",
  //         label: "surplusPackages",
  //         link: "/content-management/packages",
  //         parentId: "CONTENT_MANAGEMENT",
  //       },
  //     ],
  //   },

  //   {
  //     id: "ORDERS",
  //     label: "Orders",
  //     icon: "ri-apps-2-line",
  //     link: "/#",
  //     stateVariables: menuStates["ORDERS"] || false,
  //     click: function (e) {
  //       e.preventDefault();
  //       setMenuStates((prev) => ({ ...prev, ORDERS: !prev.ORDERS }));
  //       setIscurrentState("ORDERS");
  //       updateIconSidebar(e);
  //     },
  //     subItems: [
  //       {
  //         id: "pendingOrders",
  //         label: "Orders",
  //         link: "/orders/manage-pending-orders",
  //         parentId: "ORDERS",
  //       },

  //       {
  //         id: "OrderHistory",
  //         label: "Order History",
  //         link: "/orders/order-history",
  //         parentId: "ORDERS",
  //       },
  //     ],
  //   },

  //   {
  //     id: "USER_MANAGEMENT",
  //     label: "User Mngmnt",
  //     icon: "ri-apps-2-line",
  //     link: "/#",
  //     stateVariables: menuStates["USER_MANAGEMENT"] || false,
  //     click: function (e) {
  //       e.preventDefault();
  //       setMenuStates((prev) => ({
  //         ...prev,
  //         USER_MANAGEMENT: !prev.USER_MANAGEMENT,
  //       }));
  //       setIscurrentState("USER_MANAGEMENT");
  //       updateIconSidebar(e);
  //     },
  //     subItems: [
  //       {
  //         id: "Staff_Accounts",
  //         label: "Staff Accounts",
  //         link: "/user-management/staff-accounts",
  //         parentId: "USER_MANAGEMENT",
  //       },
  //     ],
  //   },
  // ];

  // console.log("retreivced data is:", retreivedMenus);
  const dynamicMenu = retreivedMenus.map((item) => {
    const menuItem = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      link: item.link,
      stateVariables: menuStates[item.label] || false,
      click: (e) => {
        e.preventDefault();
        setMenuStates((prev) => ({
          ...prev,
          [item.label]: !prev[item.label],
        }));
        setIscurrentState(item.label);
        updateIconSidebar(e);
      },
    };

    // Only add subItems if they exist and length > 0
    if (item.subItems && item.subItems.length > 0) {
      menuItem.subItems = item.subItems.map((sub) => ({
        id: sub.id,
        label: sub.label,
        link: sub.link,
        parentId: sub.parentId,
      }));
    }

    return menuItem;
  });

  // const menuToRender = userId === "superadmin-id" ? menuItems : dynamicMenu;

  return <React.Fragment>{visibleMenuItems}</React.Fragment>;
};

export default Navdata;
