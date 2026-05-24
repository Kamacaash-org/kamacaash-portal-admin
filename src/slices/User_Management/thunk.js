import { StaffsAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks, makeDDLThunks } from "../../helpers/thunk_factory";


export const {
    list: getStaffs,
    create: addStaff,
    update: updateStaff,
    delete: deleteStaff
} = makeCRUDThunks("setup/staff", StaffsAPI);


// DDL (dropdown) — call the new ddl endpoint
export const { list: getUnAssignedStaffDDL } = makeDDLThunks(
    "staffs/ddl",
    StaffsAPI.ddlUnassigned,
    {
        labelKey: "full_name",
        valueKey: "id",
    },
);
