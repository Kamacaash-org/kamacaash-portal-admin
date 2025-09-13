import { SurPlusCategoryAPI,BusinessAPI,StaffsAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";

export const {
    list: getCategories,
    create: addCategory,
    update: updateCategory,
    delete: deleteCategory
} = makeCRUDThunks("business-management/surplusCategory", SurPlusCategoryAPI);

export const {
    list: getBusiness,
    create: addBusiness,
    update: updateBusiness,
    delete: deleteBusiness
} = makeCRUDThunks("business-management/business", BusinessAPI);



// export const {
//     list: getPrograms,
//     create: addProgram,
//     update: updateProgram,
//     delete: deleteProgram
// } = makeCRUDThunks("setup/program", ProgramAPI);


export const {
    list: getStaffs,
    create: addStaff,
    update: updateStaff,
    delete: deleteStaff
} = makeCRUDThunks("setup/staff", StaffsAPI);

