import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../config";
const Navdata = () => {
  const history = useNavigate();
  const location = useLocation();

  const authUser = JSON.parse(sessionStorage.getItem("authUser"));
  const userId = authUser?.data?.user?._id;
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
  }, [location.pathname, retreivedMenus, isSuperAdmin, history]);

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
    {
      id: "REVIEWS",
      label: "Reviews",
      icon: "ri-star-smile-line",
      link: "/#",
      stateVariables: menuStates["REVIEWS"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, REVIEWS: !prev.REVIEWS }));
        setIscurrentState("REVIEWS");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "BusinessReviews",
          label: "All Reviews",
          link: "/reviews",
          parentId: "REVIEWS",
        },
        {
          id: "ReviewRequests",
          label: "Featured Review Requests",
          link: "/reviews/feature-requests",
          parentId: "REVIEWS",
        },
        // {
        //   id: "Moderation",
        //   label: "Moderation",
        //   link: "/reviews/moderation",
        //   parentId: "REVIEWS",
        // },
      ],
    },

    {
      id: "CONTENT",
      label: "Content",
      icon: "ri-file-list-2-line",
      link: "/#",
      stateVariables: menuStates["CONTENT"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, CONTENT: !prev.CONTENT }));
        setIscurrentState("CONTENT");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "Packages",
          label: "Packages",
          link: "/content/packages",
          parentId: "CONTENT",
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
      ],
    },
  ];

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

  return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
