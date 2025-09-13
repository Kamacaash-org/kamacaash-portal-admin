import { SurPlusCategoryAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";

export const {
    list: getCategories,
    create: addCategory,
    update: updateCategory,
    delete: deleteCategory
} = makeCRUDThunks("business-management/surplusCategory", SurPlusCategoryAPI);

// export const {
//     list: getSchools,
//     create: addSchool,
//     update: updateSchool,
//     delete: deleteSchool
// } = makeCRUDThunks("setup/school", SchoolAPI);

// export const {
//     list: getDepartments,
//     create: addDepartment,
//     update: updateDepartment,
//     delete: deleteDepartment
// } = makeCRUDThunks("setup/department", DepartmentAPI);



// export const {
//     list: getPrograms,
//     create: addProgram,
//     update: updateProgram,
//     delete: deleteProgram
// } = makeCRUDThunks("setup/program", ProgramAPI);


// export const {
//     list: getStaffs,
//     create: addStaff,
//     update: updateStaff,
//     delete: deleteStaff
// } = makeCRUDThunks("setup/staff", StaffAPI);

