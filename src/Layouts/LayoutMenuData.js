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
    menus.forEach(menu => {
      if (menu.link && menu.link !== "/#") paths.push(menu.link);
      if (menu.subItems) {
        menu.subItems.forEach(sub => {
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
      const isPermitted = permittedPaths.some(path => {
        return currentPath.startsWith(path) ||
          (path !== "/dashboard" && currentPath.includes(path));
      });

      if (!isPermitted) {
        history("/not-found");
      }
    }
  }, [location.pathname, retreivedMenus, isSuperAdmin, history]);



  // Static full-access menu for superadmin
  const menuItems = [
    // {
    //   id: "dashboard",
    //   label: "Dashboards",
    //   icon: "ri-dashboard-line",
    //   link: "/dashboard",
    //   click: (e) => {
    //     e.preventDefault();
    //     setIscurrentState("Dashboards");
    //   },
    // },

    // {
    //   id: "registrations",
    //   label: "Registrations",
    //   icon: "ri-team-line",
    //   link: "/#",
    //   stateVariables: menuStates["Registrations"] || false,
    //   click: (e) => {
    //     e.preventDefault();
    //     setMenuStates((prev) => ({ ...prev, Registrations: !prev.Registrations }));
    //     setIscurrentState("Registrations");
    //     updateIconSidebar(e);
    //   },
    //   subItems: [
    //     { id: "parents", label: "Parents", link: "/academics-parents", parentId: "registrations" },
    //     { id: "students", label: "Students", link: "/academics-students", parentId: "registrations" },
    //     { id: "teachers", label: "Teachers", link: "/academics-teachers", parentId: "registrations" },
    //   ],
    // },

    // {
    //   id: "academics",
    //   label: "Academics",
    //   icon: "ri-graduation-cap-line",
    //   link: "/#",
    //   stateVariables: menuStates["Academics"] || false,
    //   click: (e) => {
    //     e.preventDefault();
    //     setMenuStates((prev) => ({ ...prev, Academics: !prev.Academics }));
    //     setIscurrentState("Academics");
    //     updateIconSidebar(e);
    //   },
    //   subItems: [
    //     { id: "groups", label: "Groups", link: "/groups", parentId: "academics" },
    //     { id: "attendance", label: "Attendance", link: "/group-attendance", parentId: "academics" },
    //     { id: "lesson-tracking", label: "Lesson Tracking", link: "/group-lessons", parentId: "academics" },
    //   ],
    // },

    // {
    //   id: "finance",
    //   label: "Finance",
    //   icon: "ri-money-dollar-circle-line",
    //   link: "/#",
    //   stateVariables: menuStates["Finance"] || false,
    //   click: function (e) {
    //     e.preventDefault();
    //     setMenuStates((prev) => ({ ...prev, Finance: !prev.Finance }));
    //     setIscurrentState("Finance");
    //     updateIconSidebar(e);
    //   },
    //   subItems: [

    //     {
    //       id: "fee-types",
    //       label: "Fee Types",
    //       link: "/finance/fee-type",
    //       parentId: "finance",
    //     },

    //     {
    //       id: "fee-generation",
    //       label: "Fee Generation",
    //       link: "/finance/fee-generation",
    //       parentId: "finance",
    //     },
    //     {
    //       id: "receipts",
    //       label: "Receipts",
    //       link: "/finance/receipts",
    //       parentId: "finance",
    //     },
    //     {
    //       id: "expenses",
    //       label: "Expenses",
    //       link: "/finance/expenses",
    //       parentId: "finance",
    //     },
    //     {
    //       id: "expense-types",
    //       label: "Expense Types",
    //       link: "/finance/expense-types",
    //       parentId: "finance",
    //     },

    //   ]
    // },

    // {
    //   id: "reports",
    //   label: "Reports",
    //   icon: "ri-bar-chart-line",
    //   link: "/#",
    //   stateVariables: menuStates["Reports"] || false,
    //   click: function (e) {
    //     e.preventDefault();
    //     setMenuStates((prev) => ({ ...prev, Reports: !prev.Reports }));
    //     setIscurrentState("Reports");
    //     updateIconSidebar(e);
    //   },
    //   subItems: [

    //     {
    //       id: "attendance-report",
    //       label: "Lesson Report",
    //       link: "/reports/lesson",
    //       parentId: "reports",
    //     },
    //     {
    //       id: "lesson-report",
    //       label: "Attendance Report",
    //       link: "/reports/attendance",
    //       parentId: "reports",
    //     },

    //     {
    //       id: "students-without-lesson-report",
    //       label: "Student without Lesson",
    //       link: "/reports/students-without-lesson",
    //       parentId: "reports",
    //     },

    //     {
    //       id: "balance-sheet",
    //       label: "Balance Sheet",
    //       link: "/reports/balancesheet",
    //       parentId: "reports",
    //     },
    //     {
    //       id: "financial-report",
    //       label: "Gen Financial Report",
    //       link: "/general/finance/rpt",
    //       parentId: "reports",
    //     },
    //   ]
    // },

    {
      id: "settings",
      label: "Settings",
      icon: "ri-apps-2-line",
      link: "/#",
      stateVariables: menuStates["Settings"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, Settings: !prev.Settings }));
        setIscurrentState("Settings");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "profile",
          label: "University Profile",
          link: "/setting-profile",
          parentId: "settings",
        },

        {
          id: "users",
          label: "Users",
          link: "/setting-users",
          parentId: "settings",
        },
        {
          id: "roles",
          label: "Roles",
          link: "/setting-roles",
          parentId: "settings",
        },

        {
          id: "menus",
          label: "Menus",
          link: "/setting-menus",
          parentId: "settings",
        },

        {
          id: "permissions",
          label: "Permissions",
          link: "/setting-permissions",
          parentId: "settings",
        },


      ],
    },

  ];

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
      }
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
