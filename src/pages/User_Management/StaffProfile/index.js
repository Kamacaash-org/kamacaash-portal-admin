import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import {
  getMyStaffProfile,
  updateMyStaffProfile,
} from "../../../helpers/backend_helper";

const normalizeStaffProfile = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id || "",
    username: raw.username || "",
    email: raw.email || "",
    phone: raw.phone,
    firstName: raw.first_name || raw.firstName || "",
    lastName: raw.last_name || raw.lastName || "",
    fullName:
      raw.full_name ||
      raw.fullName ||
      `${raw.first_name || ""} ${raw.last_name || ""}`.trim(),
    profileImageUrl: raw.profile_image_url || raw.profileImageUrl || "",
    role: raw.role || "",
    twoFactorEnabled:
      typeof raw.two_factor_enabled === "boolean"
        ? raw.two_factor_enabled
        : Boolean(raw.twoFactorEnabled),
    business: raw.business || null,
  };
};

const toTitleCase = (value) => {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const InfoTile = ({ label, value }) => (
  <div className="border rounded-3 p-3">
    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: ".05em" }}>
      {label}
    </small>
    <div className="fw-semibold mt-1">{value || "-"}</div>
  </div>
);

const StaffProfile = () => {
  document.title = "Staff Profile | Kamacaash";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    twoFactorEnabled: false,
  });
  const [formErrors, setFormErrors] = useState({});

  const initials = useMemo(() => {
    const name = profile?.fullName || profile?.username || "ST";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [profile]);

  const syncFormWithProfile = (nextProfile) => {
    setFormState({
      username: nextProfile?.username || "",
      email: nextProfile?.email || "",
      phone: nextProfile?.phone || "",
      firstName: nextProfile?.firstName || "",
      lastName: nextProfile?.lastName || "",
      twoFactorEnabled: Boolean(nextProfile?.twoFactorEnabled),
    });
    setFormErrors({});
  };

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyStaffProfile();
      if (!response?.success) throw new Error(response?.message || "Failed to load profile");
      const nextProfile = normalizeStaffProfile(response.data);
      setProfile(nextProfile);
      syncFormWithProfile(nextProfile);
    } catch (err) {
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const validateForm = () => {
    const errors = {};
    if (!formState.firstName.trim()) errors.firstName = "First name is required";
    if (!formState.lastName.trim()) errors.lastName = "Last name is required";
    if (!formState.username.trim()) errors.username = "Username is required";
    if (!formState.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!formState.phone.trim()) errors.phone = "Phone number is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (overrides = {}) => {
    const nextState = { ...formState, ...overrides };
    return {
      username: nextState.username.trim(),
      email: nextState.email.trim(),
      phone_e164: `${nextState.phone || ""}`.trim(),
      first_name: nextState.firstName.trim(),
      last_name: nextState.lastName.trim(),
      two_factor_enabled: Boolean(nextState.twoFactorEnabled),
    };
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const response = await updateMyStaffProfile(buildPayload());
      if (!response?.success) throw new Error(response?.message || "Failed to update profile");
      toast.success("Profile updated successfully");
      setIsEditOpen(false);
      await loadProfile();
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async (enabled) => {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await updateMyStaffProfile(buildPayload({ twoFactorEnabled: enabled }));
      if (!response?.success) throw new Error(response?.message || "Failed to update 2FA");
      setProfile((prev) => ({ ...prev, twoFactorEnabled: enabled }));
      setFormState((prev) => ({ ...prev, twoFactorEnabled: enabled }));
      toast.success(`Two-factor authentication ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update 2FA");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (event) =>
    setFormState((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Staff Profile" pageTitle="Users" />

        {loading ? (
          <Loader />
        ) : error ? (
          <Alert color="danger" className="mb-0">
            <i className="ri-error-warning-line me-2" />
            {error}
          </Alert>
        ) : (
          <>
            {/* ── Hero card ── */}
            <Card className="border-0 shadow-sm overflow-hidden mb-4">
              <div
                className="position-relative"
                style={{
                  height: "200px",
                  background: "linear-gradient(135deg, #184e2f 0%, #40c637 45%, #e36814 100%)",
                }}
              >
                <div className="position-absolute top-0 end-0 p-3">
                  <Button color="light" size="sm" onClick={() => setIsEditOpen(true)}>
                    <i className="ri-edit-line me-1" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              <CardBody className="pt-0 pb-4 px-4">
                <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">

                  {/* Avatar + name */}
                  <div className="d-flex align-items-end gap-3" >
                    <div className="bg-white rounded-circle p-1 shadow flex-shrink-0">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-3"
                        style={{
                          width: "100px",
                          height: "100px",
                          background: "linear-gradient(135deg, #40c637 0%, #184e2f 100%)",
                        }}
                      >
                        {initials || "ST"}
                      </div>
                    </div>

                    <div className="pb-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <h4 className="mb-0 fw-bold">{profile?.fullName || "-"}</h4>
                        <Badge color="success" pill className="px-2 py-1">
                          <i className="ri-user-star-line me-1" />
                          {toTitleCase(profile?.role)}
                        </Badge>
                      </div>
                      <div className="d-flex flex-wrap gap-3 text-muted small">
                        <span><i className="ri-at-line me-1" />{profile?.username || "-"}</span>
                        <span><i className="ri-mail-line me-1" />{profile?.email || "-"}</span>
                        <span>
                          <i className="ri-phone-line me-1" />
                          {`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Refresh */}
                  <div className="pb-1">
                    <Button color="success" outline size="sm" onClick={loadProfile}>
                      <i className="ri-refresh-line me-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* ── Body grid ── */}
            <Row className="g-4">

              {/* Profile details */}
              <Col xl={8} className="d-flex flex-column gap-4">
                <Card className="border-0 shadow-sm">
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="avatar-sm flex-shrink-0">
                        <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                          <i className="ri-user-settings-line" />
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-0">Profile Details</h5>
                        <small className="text-muted">Your account information and business ownership details</small>
                      </div>
                    </div>

                    <Row className="g-3">
                      <Col md={6}><InfoTile label="First Name" value={profile?.firstName} /></Col>
                      <Col md={6}><InfoTile label="Last Name" value={profile?.lastName} /></Col>
                      <Col md={6}><InfoTile label="Username" value={profile?.username} /></Col>
                      <Col md={6}><InfoTile label="Email" value={profile?.email} /></Col>
                      <Col md={6}>
                        <InfoTile
                          label="Phone"
                          value={`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() || "-"}
                        />
                      </Col>
                      <Col md={6}><InfoTile label="Role" value={toTitleCase(profile?.role)} /></Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>

              {/* Right column */}
              <Col xl={4} className="d-flex flex-column gap-4">

                {/* Security */}
                <Card className="border-0 shadow-sm mb-0">
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="avatar-sm flex-shrink-0">
                        <div className="avatar-title bg-success-subtle text-success rounded-circle">
                          <i className="ri-shield-keyhole-line" />
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-0">Security</h5>
                        <small className="text-muted">Control login protection for your account</small>
                      </div>
                    </div>

                    <div className="border rounded-3 p-3 d-flex justify-content-between align-items-center gap-3">
                      <div>
                        <div className="fw-semibold">Two-Factor Authentication</div>
                        <small className="text-muted">Add extra security to sign in</small>
                      </div>
                      <Input
                        type="switch"
                        className="flex-shrink-0"
                        checked={formState.twoFactorEnabled}
                        disabled={saving}
                        onChange={(e) => handleToggle2FA(e.target.checked)}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Business */}
                <Card className="border-0 shadow-sm mb-2">
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="avatar-sm flex-shrink-0">
                        <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
                          <i className="ri-store-2-line" />
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-0">Business</h5>
                        <small className="text-muted">The business linked to this account</small>
                      </div>
                    </div>

                    <div className="border rounded-3 p-3 d-flex flex-column gap-3">
                      <InfoTile label="Display Name" value={profile?.business?.display_name} />
                      <InfoTile label="Legal Name" value={profile?.business?.legal_name} />
                    </div>
                  </CardBody>
                </Card>

              </Col>
            </Row>
          </>
        )}

        {/* ── Edit modal ── */}
        <Modal isOpen={isEditOpen} toggle={() => setIsEditOpen(false)} centered size="md">
          <ModalHeader toggle={() => setIsEditOpen(false)} className="border-bottom pb-3">
            Edit Profile
          </ModalHeader>

          <Form onSubmit={handleSaveProfile}>
            <ModalBody className="p-4">
              <Row className="g-3">
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold small">First Name</Label>
                    <Input value={formState.firstName} invalid={Boolean(formErrors.firstName)} onChange={setField("firstName")} />
                    <FormFeedback>{formErrors.firstName}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold small">Last Name</Label>
                    <Input value={formState.lastName} invalid={Boolean(formErrors.lastName)} onChange={setField("lastName")} />
                    <FormFeedback>{formErrors.lastName}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold small">Username</Label>
                    <Input value={formState.username} invalid={Boolean(formErrors.username)} onChange={setField("username")} />
                    <FormFeedback>{formErrors.username}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold small">Email</Label>
                    <Input type="email" value={formState.email} invalid={Boolean(formErrors.email)} onChange={setField("email")} />
                    <FormFeedback>{formErrors.email}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold small">Phone</Label>
                    <Input value={formState.phone} invalid={Boolean(formErrors.phone)} onChange={setField("phone")} />
                    <FormFeedback>{formErrors.phone}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <div className="border rounded-3 px-3 py-2 h-100 d-flex align-items-center justify-content-between gap-3">
                    <div>
                      <Label className="mb-0 fw-semibold small d-block">2FA</Label>
                      <small className="text-muted">Two-factor auth</small>
                    </div>
                    <Input
                      type="switch"
                      className="flex-shrink-0"
                      checked={formState.twoFactorEnabled}
                      onChange={(e) => setFormState((prev) => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                    />
                  </div>
                </Col>
              </Row>
            </ModalBody>

            <ModalFooter className="border-top pt-3 gap-2">
              <Button color="light" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button color="primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>

      <ToastContainer />
    </div>
  );
};

export default StaffProfile;
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Alert,
//   Badge,
//   Button,
//   Card,
//   CardBody,
//   Col,
//   Container,
//   Form,
//   FormFeedback,
//   FormGroup,
//   Input,
//   Label,
//   Modal,
//   ModalBody,
//   ModalFooter,
//   ModalHeader,
//   Row,
// } from "reactstrap";
// import { toast, ToastContainer } from "react-toastify";

// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import Loader from "../../../Components/Common/Loader";
// import {
//   getMyStaffProfile,
//   updateMyStaffProfile,
// } from "../../../helpers/backend_helper";

// const normalizeStaffProfile = (raw) => {
//   if (!raw) return null;

//   return {
//     id: raw.id || "",
//     username: raw.username || "",
//     email: raw.email || "",
//     phone: raw.phone,
//     firstName: raw.first_name || raw.firstName || "",
//     lastName: raw.last_name || raw.lastName || "",
//     fullName:
//       raw.full_name ||
//       raw.fullName ||
//       `${raw.first_name || ""} ${raw.last_name || ""}`.trim(),
//     profileImageUrl: raw.profile_image_url || raw.profileImageUrl || "",
//     role: raw.role || "",
//     twoFactorEnabled:
//       typeof raw.two_factor_enabled === "boolean"
//         ? raw.two_factor_enabled
//         : Boolean(raw.twoFactorEnabled),
//     business: raw.business || null,
//   };
// };

// const toTitleCase = (value) => {
//   if (!value) return "-";

//   return String(value)
//     .replaceAll("_", " ")
//     .toLowerCase()
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// };

// const StaffProfile = () => {
//   document.title = "Staff Profile | Kamacaash";

//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [formState, setFormState] = useState({
//     username: "",
//     email: "",
//     phone: "",
//     firstName: "",
//     lastName: "",
//     twoFactorEnabled: false,
//   });
//   const [formErrors, setFormErrors] = useState({});

//   const initials = useMemo(() => {
//     const name = profile?.fullName || profile?.username || "ST";
//     return name
//       .split(" ")
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((part) => part.charAt(0).toUpperCase())
//       .join("");
//   }, [profile]);

//   const syncFormWithProfile = (nextProfile) => {
//     setFormState({
//       username: nextProfile?.username || "",
//       email: nextProfile?.email || "",
//       phone: nextProfile?.phone || "",
//       firstName: nextProfile?.firstName || "",
//       lastName: nextProfile?.lastName || "",
//       twoFactorEnabled: Boolean(nextProfile?.twoFactorEnabled),
//     });
//     setFormErrors({});
//   };

//   const loadProfile = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const response = await getMyStaffProfile();
//       if (!response?.success) {
//         throw new Error(response?.message || "Failed to load profile");
//       }

//       const nextProfile = normalizeStaffProfile(response.data);
//       setProfile(nextProfile);
//       syncFormWithProfile(nextProfile);
//     } catch (err) {
//       setError(err?.message || "Failed to load profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadProfile();
//   }, []);

//   const validateForm = () => {
//     const errors = {};

//     if (!formState.firstName.trim()) errors.firstName = "First name is required";
//     if (!formState.lastName.trim()) errors.lastName = "Last name is required";
//     if (!formState.username.trim()) errors.username = "Username is required";
//     if (!formState.email.trim()) {
//       errors.email = "Email is required";
//     } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
//       errors.email = "Enter a valid email address";
//     }
//     if (!formState.phone.trim()) errors.phone = "Phone number is required";

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const buildPayload = (overrides = {}) => {
//     const nextState = {
//       ...formState,
//       ...overrides,
//     };

//     return {
//       username: nextState.username.trim(),
//       email: nextState.email.trim(),
//       phone_e164: `${nextState.phone || ""}`.trim(),
//       first_name: nextState.firstName.trim(),
//       last_name: nextState.lastName.trim(),
//       two_factor_enabled: Boolean(nextState.twoFactorEnabled),
//     };
//   };

//   const handleSaveProfile = async (event) => {
//     event.preventDefault();
//     if (!validateForm()) return;

//     setSaving(true);
//     try {
//       const response = await updateMyStaffProfile(buildPayload());
//       if (!response?.success) {
//         throw new Error(response?.message || "Failed to update profile");
//       }

//       toast.success("Profile updated successfully");
//       setIsEditOpen(false);
//       await loadProfile();
//     } catch (err) {
//       toast.error(err?.message || "Failed to update profile");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleToggle2FA = async (enabled) => {
//     if (!profile) return;

//     setSaving(true);
//     try {
//       const response = await updateMyStaffProfile(
//         buildPayload({ twoFactorEnabled: enabled }),
//       );
//       if (!response?.success) {
//         throw new Error(response?.message || "Failed to update 2FA");
//       }

//       setProfile((prev) => ({
//         ...prev,
//         twoFactorEnabled: enabled,
//       }));
//       setFormState((prev) => ({
//         ...prev,
//         twoFactorEnabled: enabled,
//       }));
//       toast.success(
//         `Two-factor authentication ${enabled ? "enabled" : "disabled"}`,
//       );
//     } catch (err) {
//       toast.error(err?.message || "Failed to update 2FA");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Staff Profile" pageTitle="Users" />

//         {loading ? (
//           <Loader />
//         ) : error ? (
//           <Alert color="danger" className="mb-0">
//             <i className="ri-error-warning-line me-2"></i>
//             {error}
//           </Alert>
//         ) : (
//           <>
//             <Card className="border-0 shadow-sm overflow-hidden mb-4">
//               <div
//                 style={{
//                   minHeight: "220px",
//                   background:
//                     "linear-gradient(135deg, #184e2f 0%, #40c637 45%, #e36814 100%)",
//                 }}
//                 className="position-relative"
//               >
//                 <div className="position-absolute top-0 end-0 p-4">
//                   <Button color="light" onClick={() => setIsEditOpen(true)}>
//                     <i className="ri-edit-line me-1"></i>
//                     Edit Profile
//                   </Button>
//                 </div>
//               </div>
//               <CardBody className="pt-0">
//                 <div className="d-flex flex-wrap align-items-end justify-content-between gap-4">
//                   <div className="d-flex align-items-end gap-4">
//                     <div style={{ marginTop: "-56px" }}>
//                       <div className="bg-white rounded-circle p-1 shadow">
//                         <div
//                           className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
//                           style={{
//                             width: "112px",
//                             height: "112px",
//                             fontSize: "2rem",
//                             background:
//                               "linear-gradient(135deg, #40c637 0%, #184e2f 100%)",
//                           }}
//                         >
//                           {initials || "ST"}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="pb-2">
//                       <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
//                         <h2 className="mb-0">{profile?.fullName || "-"}</h2>
//                         <Badge color="success" pill className="px-3 py-2">
//                           <i className="ri-user-star-line me-1"></i>
//                           {toTitleCase(profile?.role)}
//                         </Badge>
//                       </div>
//                       <div className="text-muted d-flex flex-wrap gap-3">
//                         <span>
//                           <i className="ri-at-line me-1"></i>
//                           {profile?.username || "-"}
//                         </span>
//                         <span>
//                           <i className="ri-mail-line me-1"></i>
//                           {profile?.email || "-"}
//                         </span>
//                         <span>
//                           <i className="ri-phone-line me-1"></i>
//                           {`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() ||
//                             "-"}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="pb-2">
//                     <Button color="success" outline onClick={loadProfile}>
//                       <i className="ri-refresh-line me-1"></i>
//                       Refresh
//                     </Button>
//                   </div>
//                 </div>
//               </CardBody>
//             </Card>

//             <Row className="g-4">
//               <Col xl={8}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardBody className="p-4">
//                     <div className="d-flex align-items-center gap-2 mb-4">
//                       <div className="avatar-sm">
//                         <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
//                           <i className="ri-user-settings-line"></i>
//                         </div>
//                       </div>
//                       <div>
//                         <h5 className="mb-0">Profile Details</h5>
//                         <small className="text-muted">
//                           Your account information and business ownership details
//                         </small>
//                       </div>
//                     </div>

//                     <Row className="g-4">
//                       <Col md={6}>
//                         <div className="border rounded-3 p-3 h-100">
//                           <small className="text-muted d-block mb-1">
//                             First Name
//                           </small>
//                           <div className="fw-semibold">{profile?.firstName || "-"}</div>
//                         </div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="border rounded-3 p-3 h-100">
//                           <small className="text-muted d-block mb-1">
//                             Last Name
//                           </small>
//                           <div className="fw-semibold">{profile?.lastName || "-"}</div>
//                         </div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="border rounded-3 p-3 h-100">
//                           <small className="text-muted d-block mb-1">Username</small>
//                           <div className="fw-semibold">{profile?.username || "-"}</div>
//                         </div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="border rounded-3 p-3 h-100">
//                           <small className="text-muted d-block mb-1">Email</small>
//                           <div className="fw-semibold">{profile?.email || "-"}</div>
//                         </div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="border rounded-3 p-3 h-100">
//                           <small className="text-muted d-block mb-1">Phone</small>
//                           <div className="fw-semibold">
//                             {`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() ||
//                               "-"}
//                           </div>
//                         </div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="border rounded-3 p-3 h-100">
//                           <small className="text-muted d-block mb-1">Role</small>
//                           <div className="fw-semibold">{toTitleCase(profile?.role)}</div>
//                         </div>
//                       </Col>
//                     </Row>
//                   </CardBody>
//                 </Card>
//               </Col>

//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm mb-4">
//                   <CardBody className="p-4">
//                     <div className="d-flex align-items-center gap-2 mb-4">
//                       <div className="avatar-sm">
//                         <div className="avatar-title bg-success-subtle text-success rounded-circle">
//                           <i className="ri-shield-keyhole-line"></i>
//                         </div>
//                       </div>
//                       <div>
//                         <h5 className="mb-0">Security</h5>
//                         <small className="text-muted">
//                           Control login protection for your account
//                         </small>
//                       </div>
//                     </div>

//                     <div className="d-flex justify-content-between align-items-center border rounded-3 p-3">
//                       <div>
//                         <div className="fw-semibold">Two-Factor Authentication</div>
//                         <small className="text-muted">
//                           Add extra security to sign in
//                         </small>
//                       </div>
//                       <Input
//                         type="switch"
//                         checked={formState.twoFactorEnabled}
//                         disabled={saving}
//                         onChange={(event) => handleToggle2FA(event.target.checked)}
//                       />
//                     </div>
//                   </CardBody>
//                 </Card>

//                 <Card className="border-0 shadow-sm">
//                   <CardBody className="p-4">
//                     <div className="d-flex align-items-center gap-2 mb-4">
//                       <div className="avatar-sm">
//                         <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
//                           <i className="ri-store-2-line"></i>
//                         </div>
//                       </div>
//                       <div>
//                         <h5 className="mb-0">Business</h5>
//                         <small className="text-muted">
//                           The business linked to this account
//                         </small>
//                       </div>
//                     </div>

//                     <div className="border rounded-3 p-3">
//                       <small className="text-muted d-block mb-1">Display Name</small>
//                       <div className="fw-semibold mb-3">
//                         {profile?.business?.display_name || "-"}
//                       </div>
//                       <small className="text-muted d-block mb-1">Legal Name</small>
//                       <div className="fw-semibold">
//                         {profile?.business?.legal_name || "-"}
//                       </div>
//                     </div>
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>
//           </>
//         )}

//         <Modal isOpen={isEditOpen} toggle={() => setIsEditOpen(false)} centered>
//           <ModalHeader toggle={() => setIsEditOpen(false)}>
//             Edit Profile
//           </ModalHeader>
//           <Form onSubmit={handleSaveProfile}>
//             <ModalBody>
//               <Row className="g-3">
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label>First Name</Label>
//                     <Input
//                       value={formState.firstName}
//                       invalid={Boolean(formErrors.firstName)}
//                       onChange={(event) =>
//                         setFormState((prev) => ({
//                           ...prev,
//                           firstName: event.target.value,
//                         }))
//                       }
//                     />
//                     <FormFeedback>{formErrors.firstName}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label>Last Name</Label>
//                     <Input
//                       value={formState.lastName}
//                       invalid={Boolean(formErrors.lastName)}
//                       onChange={(event) =>
//                         setFormState((prev) => ({
//                           ...prev,
//                           lastName: event.target.value,
//                         }))
//                       }
//                     />
//                     <FormFeedback>{formErrors.lastName}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label>Username</Label>
//                     <Input
//                       value={formState.username}
//                       invalid={Boolean(formErrors.username)}
//                       onChange={(event) =>
//                         setFormState((prev) => ({
//                           ...prev,
//                           username: event.target.value,
//                         }))
//                       }
//                     />
//                     <FormFeedback>{formErrors.username}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label>Email</Label>
//                     <Input
//                       type="email"
//                       value={formState.email}
//                       invalid={Boolean(formErrors.email)}
//                       onChange={(event) =>
//                         setFormState((prev) => ({
//                           ...prev,
//                           email: event.target.value,
//                         }))
//                       }
//                     />
//                     <FormFeedback>{formErrors.email}</FormFeedback>
//                   </FormGroup>
//                 </Col>

//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label>Phone</Label>
//                     <Input
//                       value={formState.phone}
//                       invalid={Boolean(formErrors.phone)}
//                       onChange={(event) =>
//                         setFormState((prev) => ({
//                           ...prev,
//                           phone: event.target.value,
//                         }))
//                       }
//                     />
//                     <FormFeedback>{formErrors.phone}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <div className="border rounded-3 px-3 py-2 d-flex justify-content-between align-items-center">
//                     <div>
//                       <Label className="mb-1 d-block">2FA</Label>

//                     </div>
//                     <Input
//                       type="switch"
//                       checked={formState.twoFactorEnabled}
//                       onChange={(event) =>
//                         setFormState((prev) => ({
//                           ...prev,
//                           twoFactorEnabled: event.target.checked,
//                         }))
//                       }
//                     />
//                   </div>
//                 </Col>
//               </Row>
//             </ModalBody>
//             <ModalFooter>
//               <Button color="light" onClick={() => setIsEditOpen(false)}>
//                 Cancel
//               </Button>
//               <Button color="primary" type="submit" disabled={saving}>
//                 {saving ? "Saving..." : "Save Changes"}
//               </Button>
//             </ModalFooter>
//           </Form>
//         </Modal>
//       </Container>
//       <ToastContainer />
//     </div>
//   );
// };

// export default StaffProfile;
