import { DepartmentAPI, ProgramAPI, ProgramCategoryAPI, SchoolAPI, StaffAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";

export const {
    list: getProgramsCategories,
    create: addProgramCategory,
    update: updateProgramCategory,
    delete: deleteProgramCategory
} = makeCRUDThunks("setup/programCategory", ProgramCategoryAPI);

export const {
    list: getSchools,
    create: addSchool,
    update: updateSchool,
    delete: deleteSchool
} = makeCRUDThunks("setup/school", SchoolAPI);

export const {
    list: getDepartments,
    create: addDepartment,
    update: updateDepartment,
    delete: deleteDepartment
} = makeCRUDThunks("setup/department", DepartmentAPI);



export const {
    list: getPrograms,
    create: addProgram,
    update: updateProgram,
    delete: deleteProgram
} = makeCRUDThunks("setup/program", ProgramAPI);


export const {
    list: getStaffs,
    create: addStaff,
    update: updateStaff,
    delete: deleteStaff
} = makeCRUDThunks("setup/staff", StaffAPI);

