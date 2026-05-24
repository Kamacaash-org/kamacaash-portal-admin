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
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import classnames from "classnames";

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
    joinedDate: raw.created_at || raw.joinedDate || null,
  };
};

const toTitleCase = (value) => {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const StatCard = ({ icon, color, title, value, subtitle }) => (
  <Card className="border-0 shadow-sm h-100">
    <CardBody>
      <div className="d-flex align-items-center">
        <div className={`flex-shrink-0 avatar-sm rounded-circle bg-${color}-subtle d-flex align-items-center justify-content-center`}>
          <i className={`ri-${icon} text-${color} fs-4`}></i>
        </div>
        <div className="flex-grow-1 ms-3">
          <h6 className="text-muted mb-1 small text-uppercase fw-semibold">{title}</h6>
          <h4 className="mb-1 fw-bold">{value}</h4>
          <small className="text-muted">{subtitle}</small>
        </div>
      </div>
    </CardBody>
  </Card>
);

const StaffProfile = () => {
  document.title = "Staff Profile | Kamacaash";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
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
    <div className="page-content" style={{ background: "#f8f9fc" }}>
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
            {/* Modern Profile Header */}
            <div className="position-relative rounded-4 overflow-hidden mb-4 shadow-sm">
              <div
                className="position-relative"
                style={{
                  height: "280px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                }}
              >
                <div className="position-absolute top-0 end-0 p-4">
                  <Button
                    color="light"
                    onClick={() => setIsEditOpen(true)}
                    className="shadow-sm"
                  >
                    <i className="ri-edit-box-line me-2" />
                    Edit Profile
                  </Button>
                </div>

                {/* Wave SVG */}
                <div className="position-absolute bottom-0 start-0 w-100" style={{ marginBottom: "-1px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" style={{ display: "block", width: "100%" }}>
                    <path fill="#f8f9fc" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
                  </svg>
                </div>
              </div>

              {/* Profile Info Card */}
              <div className="position-relative px-4" style={{ marginTop: "-80px" }}>
                <Card className="border-0 shadow-lg rounded-4">
                  <CardBody className="p-4">
                    <div className="d-flex flex-wrap align-items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="bg-white rounded-circle p-2 shadow-lg">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-2"
                            style={{
                              width: "120px",
                              height: "120px",
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            {initials || "ST"}
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                          <h2 className="mb-0 fw-bold">{profile?.fullName || "-"}</h2>
                          <Badge
                            color="primary"
                            pill
                            className="px-3 py-2 fs-6"
                            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                          >
                            <i className="ri-user-star-line me-1" />
                            {toTitleCase(profile?.role)}
                          </Badge>
                        </div>

                        <div className="d-flex flex-wrap gap-4">
                          <div className="d-flex align-items-center text-muted">
                            <i className="ri-at-line me-2 fs-5" />
                            <span>{profile?.username || "-"}</span>
                          </div>
                          <div className="d-flex align-items-center text-muted">
                            <i className="ri-mail-line me-2 fs-5" />
                            <span>{profile?.email || "-"}</span>
                          </div>
                          <div className="d-flex align-items-center text-muted">
                            <i className="ri-phone-line me-2 fs-5" />
                            <span>{`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() || "-"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0">
                        <div className="text-center">
                          <div className="small text-muted text-uppercase fw-semibold">Member Since</div>
                          <div className="fw-bold mt-1">
                            {profile?.joinedDate
                              ? new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-4">
              <Nav tabs className="nav-tabs-custom bg-white rounded-top shadow-sm">
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "1" })}
                    onClick={() => setActiveTab("1")}
                  >
                    <i className="ri-user-settings-line me-2"></i>
                    Profile Overview
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "2" })}
                    onClick={() => setActiveTab("2")}
                  >
                    <i className="ri-shield-keyhole-line me-2"></i>
                    Security
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "3" })}
                    onClick={() => setActiveTab("3")}
                  >
                    <i className="ri-store-2-line me-2"></i>
                    Business Info
                  </NavLink>
                </NavItem>
              </Nav>

              <TabContent activeTab={activeTab} className="mt-3">
                {/* Profile Overview Tab */}
                <TabPane tabId="1">
                  <Row className="g-4">
                    <Col lg={8}>
                      <Card className="border-0 shadow-sm rounded-4">
                        <CardBody className="p-4">
                          <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
                            <div className="avatar-sm bg-primary-subtle rounded-3 d-flex align-items-center justify-content-center">
                              <i className="ri-information-line text-primary fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">Personal Information</h5>
                              <small className="text-muted">Your personal details and account information</small>
                            </div>
                          </div>

                          <Row className="g-4">
                            <Col md={6}>
                              <div className="border-start border-3 border-primary ps-3">
                                <small className="text-muted text-uppercase d-block fw-semibold mb-1">First Name</small>
                                <div className="fs-5 fw-semibold">{profile?.firstName || "-"}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="border-start border-3 border-primary ps-3">
                                <small className="text-muted text-uppercase d-block fw-semibold mb-1">Last Name</small>
                                <div className="fs-5 fw-semibold">{profile?.lastName || "-"}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="border-start border-3 border-primary ps-3">
                                <small className="text-muted text-uppercase d-block fw-semibold mb-1">Username</small>
                                <div className="fs-5 fw-semibold">@{profile?.username || "-"}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="border-start border-3 border-primary ps-3">
                                <small className="text-muted text-uppercase d-block fw-semibold mb-1">Email Address</small>
                                <div className="fs-5 fw-semibold">{profile?.email || "-"}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="border-start border-3 border-primary ps-3">
                                <small className="text-muted text-uppercase d-block fw-semibold mb-1">Phone Number</small>
                                <div className="fs-5 fw-semibold">{`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() || "-"}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="border-start border-3 border-primary ps-3">
                                <small className="text-muted text-uppercase d-block fw-semibold mb-1">Role</small>
                                <div className="fs-5 fw-semibold">{toTitleCase(profile?.role)}</div>
                              </div>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col lg={4}>
                      <Card className="border-0 shadow-sm rounded-4 bg-primary bg-opacity-10">
                        <CardBody className="p-4 text-center">
                          <div className="avatar-lg bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3">
                            <i className="ri-user-star-line text-white fs-1"></i>
                          </div>
                          <h5 className="mb-1">{profile?.fullName}</h5>
                          <p className="text-muted small mb-3">{toTitleCase(profile?.role)}</p>
                          <Button color="primary" outline size="sm" onClick={loadProfile}>
                            <i className="ri-refresh-line me-1"></i>
                            Refresh Profile
                          </Button>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* Security Tab */}
                <TabPane tabId="2">
                  <Row className="g-4 mb-3">
                    <Col lg={6}>
                      <Card className="border-0 shadow-sm rounded-4 h-100">
                        <CardBody className="p-4">
                          <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
                            <div className="avatar-sm bg-success-subtle rounded-3 d-flex align-items-center justify-content-center">
                              <i className="ri-shield-check-line text-success fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">Authentication</h5>
                              <small className="text-muted">Manage your account security</small>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                            <div>
                              <div className="fw-semibold mb-1">Two-Factor Authentication</div>
                              <small className="text-muted">Add an extra layer of security to your account</small>
                            </div>
                            <Input
                              type="switch"
                              className="ms-3"
                              style={{ width: "50px", height: "24px" }}
                              checked={formState.twoFactorEnabled}
                              disabled={saving}
                              onChange={(e) => handleToggle2FA(e.target.checked)}
                            />
                          </div>

                          {formState.twoFactorEnabled && (
                            <Alert color="success" className="mt-3 mb-0">
                              <i className="ri-checkbox-circle-line me-2"></i>
                              2FA is currently <strong>enabled</strong> for your account
                            </Alert>
                          )}
                        </CardBody>
                      </Card>
                    </Col>

                    <Col lg={6}>
                      <Card className="border-0 shadow-sm rounded-4 h-100">
                        <CardBody className="p-4">
                          <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
                            <div className="avatar-sm bg-info-subtle rounded-3 d-flex align-items-center justify-content-center">
                              <i className="ri-lock-password-line text-info fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">Password</h5>
                              <small className="text-muted">Keep your password secure</small>
                            </div>
                          </div>

                          <div className="text-center py-3">
                            <i className="ri-shield-keyhole-line text-muted fs-1 mb-3 d-block"></i>
                            <p className="text-muted mb-3">Password reset functionality is available through your email</p>
                            <Button color="info" outline>
                              <i className="ri-mail-send-line me-2"></i>
                              Request Password Reset
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* Business Info Tab */}
                <TabPane tabId="3">
                  <Row className="g-4">
                    <Col lg={6}>
                      <Card className="border-0 shadow-sm rounded-4">
                        <CardBody className="p-4">
                          <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
                            <div className="avatar-sm bg-warning-subtle rounded-3 d-flex align-items-center justify-content-center">
                              <i className="ri-store-3-line text-warning fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">Business Details</h5>
                              <small className="text-muted">Information about your associated business</small>
                            </div>
                          </div>

                          <div className="vstack gap-3">
                            <div className="p-3 bg-light rounded-3">
                              <small className="text-muted text-uppercase d-block fw-semibold mb-2">Display Name</small>
                              <div className="fs-6 fw-semibold">{profile?.business?.display_name || "-"}</div>
                            </div>
                            <div className="p-3 bg-light rounded-3">
                              <small className="text-muted text-uppercase d-block fw-semibold mb-2">Legal Name</small>
                              <div className="fs-6 fw-semibold">{profile?.business?.legal_name || "-"}</div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col lg={6}>
                      <Card className="border-0 shadow-sm rounded-4 bg-primary bg-opacity-10">
                        <CardBody className="p-4 text-center">
                          <div className="avatar-xl bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm">
                            <i className="ri-building-line text-primary fs-1"></i>
                          </div>
                          <h5 className="mb-2">{profile?.business?.display_name || "No Business Associated"}</h5>
                          <p className="text-muted small">
                            {profile?.business?.legal_name || "Business information not available"}
                          </p>
                          <Button color="primary" disabled>
                            <i className="ri-exchange-funds-line me-2"></i>
                            View Business Dashboard
                          </Button>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
              </TabContent>
            </div>
          </>
        )}

        {/* Edit Modal - Enhanced Version */}
        <Modal isOpen={isEditOpen} toggle={() => setIsEditOpen(false)} centered size="lg">
          <ModalHeader toggle={() => setIsEditOpen(false)} className="border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <div className="avatar-sm bg-primary-subtle rounded-3 d-flex align-items-center justify-content-center">
                <i className="ri-edit-box-line text-primary fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0">Edit Profile</h5>
                <small className="text-muted">Update your personal information</small>
              </div>
            </div>
          </ModalHeader>

          <Form onSubmit={handleSaveProfile}>
            <ModalBody className="p-4">
              <Row className="g-4">
                <Col md={6}>
                  <FormGroup>
                    <Label className="fw-semibold small text-uppercase mb-2">
                      <i className="ri-user-line me-1"></i> First Name
                    </Label>
                    <Input
                      value={formState.firstName}
                      invalid={Boolean(formErrors.firstName)}
                      onChange={setField("firstName")}
                      placeholder="Enter first name"
                      className="py-2"
                    />
                    <FormFeedback>{formErrors.firstName}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="fw-semibold small text-uppercase mb-2">
                      <i className="ri-user-line me-1"></i> Last Name
                    </Label>
                    <Input
                      value={formState.lastName}
                      invalid={Boolean(formErrors.lastName)}
                      onChange={setField("lastName")}
                      placeholder="Enter last name"
                      className="py-2"
                    />
                    <FormFeedback>{formErrors.lastName}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="fw-semibold small text-uppercase mb-2">
                      <i className="ri-at-line me-1"></i> Username
                    </Label>
                    <Input
                      value={formState.username}
                      invalid={Boolean(formErrors.username)}
                      onChange={setField("username")}
                      placeholder="Enter username"
                      className="py-2"
                    />
                    <FormFeedback>{formErrors.username}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="fw-semibold small text-uppercase mb-2">
                      <i className="ri-mail-line me-1"></i> Email
                    </Label>
                    <Input
                      type="email"
                      value={formState.email}
                      invalid={Boolean(formErrors.email)}
                      onChange={setField("email")}
                      placeholder="Enter email address"
                      className="py-2"
                    />
                    <FormFeedback>{formErrors.email}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="fw-semibold small text-uppercase mb-2">
                      <i className="ri-phone-line me-1"></i> Phone
                    </Label>
                    <Input
                      value={formState.phone}
                      invalid={Boolean(formErrors.phone)}
                      onChange={setField("phone")}
                      placeholder="Enter phone number"
                      className="py-2"
                    />
                    <FormFeedback>{formErrors.phone}</FormFeedback>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <Label className="fw-semibold small text-uppercase mb-2 d-block">
                      <i className="ri-shield-keyhole-line me-1"></i> Two-Factor Authentication
                    </Label>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Enable additional security for your account</small>
                      <Input
                        type="switch"
                        className="ms-3"
                        style={{ width: "50px" }}
                        checked={formState.twoFactorEnabled}
                        onChange={(e) => setFormState((prev) => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </ModalBody>

            <ModalFooter className="border-0 pt-0 gap-2">
              <Button color="light" onClick={() => setIsEditOpen(false)} className="px-4">
                Cancel
              </Button>
              <Button color="primary" type="submit" disabled={saving} className="px-4">
                {saving ? (
                  <>
                    <i className="ri-loader-4-line spin me-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line me-2"></i>
                    Save Changes
                  </>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>

      <ToastContainer />

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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

// const InfoTile = ({ label, value }) => (
//   <div className="border rounded-3 p-3">
//     <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: ".05em" }}>
//       {label}
//     </small>
//     <div className="fw-semibold mt-1">{value || "-"}</div>
//   </div>
// );

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
//       if (!response?.success) throw new Error(response?.message || "Failed to load profile");
//       const nextProfile = normalizeStaffProfile(response.data);
//       setProfile(nextProfile);
//       syncFormWithProfile(nextProfile);
//     } catch (err) {
//       setError(err?.message || "Failed to load profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadProfile(); }, []);

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
//     const nextState = { ...formState, ...overrides };
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
//       if (!response?.success) throw new Error(response?.message || "Failed to update profile");
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
//       const response = await updateMyStaffProfile(buildPayload({ twoFactorEnabled: enabled }));
//       if (!response?.success) throw new Error(response?.message || "Failed to update 2FA");
//       setProfile((prev) => ({ ...prev, twoFactorEnabled: enabled }));
//       setFormState((prev) => ({ ...prev, twoFactorEnabled: enabled }));
//       toast.success(`Two-factor authentication ${enabled ? "enabled" : "disabled"}`);
//     } catch (err) {
//       toast.error(err?.message || "Failed to update 2FA");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const setField = (key) => (event) =>
//     setFormState((prev) => ({ ...prev, [key]: event.target.value }));

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Staff Profile" pageTitle="Users" />

//         {loading ? (
//           <Loader />
//         ) : error ? (
//           <Alert color="danger" className="mb-0">
//             <i className="ri-error-warning-line me-2" />
//             {error}
//           </Alert>
//         ) : (
//           <>
//             {/* ── Hero card ── */}
//             <Card className="border-0 shadow-sm overflow-hidden mb-4">
//               <div
//                 className="position-relative"
//                 style={{
//                   height: "200px",
//                   background: "linear-gradient(135deg, #184e2f 0%, #40c637 45%, #e36814 100%)",
//                 }}
//               >
//                 <div className="position-absolute top-0 end-0 p-3">
//                   <Button color="light" size="sm" onClick={() => setIsEditOpen(true)}>
//                     <i className="ri-edit-line me-1" />
//                     Edit Profile
//                   </Button>
//                 </div>
//               </div>

//               <CardBody className="pt-0 pb-4 px-4">
//                 <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">

//                   {/* Avatar + name */}
//                   <div className="d-flex align-items-end gap-3" >
//                     <div className="bg-white rounded-circle p-1 shadow flex-shrink-0">
//                       <div
//                         className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-3"
//                         style={{
//                           width: "100px",
//                           height: "100px",
//                           background: "linear-gradient(135deg, #40c637 0%, #184e2f 100%)",
//                         }}
//                       >
//                         {initials || "ST"}
//                       </div>
//                     </div>

//                     <div className="pb-1">
//                       <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
//                         <h4 className="mb-0 fw-bold">{profile?.fullName || "-"}</h4>
//                         <Badge color="success" pill className="px-2 py-1">
//                           <i className="ri-user-star-line me-1" />
//                           {toTitleCase(profile?.role)}
//                         </Badge>
//                       </div>
//                       <div className="d-flex flex-wrap gap-3 text-muted small">
//                         <span><i className="ri-at-line me-1" />{profile?.username || "-"}</span>
//                         <span><i className="ri-mail-line me-1" />{profile?.email || "-"}</span>
//                         <span>
//                           <i className="ri-phone-line me-1" />
//                           {`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() || "-"}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Refresh */}
//                   <div className="pb-1">
//                     <Button color="success" outline size="sm" onClick={loadProfile}>
//                       <i className="ri-refresh-line me-1" />
//                       Refresh
//                     </Button>
//                   </div>
//                 </div>
//               </CardBody>
//             </Card>

//             {/* ── Body grid ── */}
//             <Row className="g-4">

//               {/* Profile details */}
//               <Col xl={8} className="d-flex flex-column gap-4">
//                 <Card className="border-0 shadow-sm">
//                   <CardBody className="p-4">
//                     <div className="d-flex align-items-center gap-3 mb-4">
//                       <div className="avatar-sm flex-shrink-0">
//                         <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
//                           <i className="ri-user-settings-line" />
//                         </div>
//                       </div>
//                       <div>
//                         <h5 className="mb-0">Profile Details</h5>
//                         <small className="text-muted">Your account information and business ownership details</small>
//                       </div>
//                     </div>

//                     <Row className="g-3">
//                       <Col md={6}><InfoTile label="First Name" value={profile?.firstName} /></Col>
//                       <Col md={6}><InfoTile label="Last Name" value={profile?.lastName} /></Col>
//                       <Col md={6}><InfoTile label="Username" value={profile?.username} /></Col>
//                       <Col md={6}><InfoTile label="Email" value={profile?.email} /></Col>
//                       <Col md={6}>
//                         <InfoTile
//                           label="Phone"
//                           value={`${profile?.countryCode || ""} ${profile?.phone || ""}`.trim() || "-"}
//                         />
//                       </Col>
//                       <Col md={6}><InfoTile label="Role" value={toTitleCase(profile?.role)} /></Col>
//                     </Row>
//                   </CardBody>
//                 </Card>
//               </Col>

//               {/* Right column */}
//               <Col xl={4} className="d-flex flex-column gap-4">

//                 {/* Security */}
//                 <Card className="border-0 shadow-sm mb-0">
//                   <CardBody className="p-4">
//                     <div className="d-flex align-items-center gap-3 mb-4">
//                       <div className="avatar-sm flex-shrink-0">
//                         <div className="avatar-title bg-success-subtle text-success rounded-circle">
//                           <i className="ri-shield-keyhole-line" />
//                         </div>
//                       </div>
//                       <div>
//                         <h5 className="mb-0">Security</h5>
//                         <small className="text-muted">Control login protection for your account</small>
//                       </div>
//                     </div>

//                     <div className="border rounded-3 p-3 d-flex justify-content-between align-items-center gap-3">
//                       <div>
//                         <div className="fw-semibold">Two-Factor Authentication</div>
//                         <small className="text-muted">Add extra security to sign in</small>
//                       </div>
//                       <Input
//                         type="switch"
//                         className="flex-shrink-0"
//                         checked={formState.twoFactorEnabled}
//                         disabled={saving}
//                         onChange={(e) => handleToggle2FA(e.target.checked)}
//                       />
//                     </div>
//                   </CardBody>
//                 </Card>

//                 {/* Business */}
//                 <Card className="border-0 shadow-sm mb-2">
//                   <CardBody className="p-4">
//                     <div className="d-flex align-items-center gap-3 mb-4">
//                       <div className="avatar-sm flex-shrink-0">
//                         <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
//                           <i className="ri-store-2-line" />
//                         </div>
//                       </div>
//                       <div>
//                         <h5 className="mb-0">Business</h5>
//                         <small className="text-muted">The business linked to this account</small>
//                       </div>
//                     </div>

//                     <div className="border rounded-3 p-3 d-flex flex-column gap-3">
//                       <InfoTile label="Display Name" value={profile?.business?.display_name} />
//                       <InfoTile label="Legal Name" value={profile?.business?.legal_name} />
//                     </div>
//                   </CardBody>
//                 </Card>

//               </Col>
//             </Row>
//           </>
//         )}

//         {/* ── Edit modal ── */}
//         <Modal isOpen={isEditOpen} toggle={() => setIsEditOpen(false)} centered size="md">
//           <ModalHeader toggle={() => setIsEditOpen(false)} className="border-bottom pb-3">
//             Edit Profile
//           </ModalHeader>

//           <Form onSubmit={handleSaveProfile}>
//             <ModalBody className="p-4">
//               <Row className="g-3">
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label className="fw-semibold small">First Name</Label>
//                     <Input value={formState.firstName} invalid={Boolean(formErrors.firstName)} onChange={setField("firstName")} />
//                     <FormFeedback>{formErrors.firstName}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label className="fw-semibold small">Last Name</Label>
//                     <Input value={formState.lastName} invalid={Boolean(formErrors.lastName)} onChange={setField("lastName")} />
//                     <FormFeedback>{formErrors.lastName}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label className="fw-semibold small">Username</Label>
//                     <Input value={formState.username} invalid={Boolean(formErrors.username)} onChange={setField("username")} />
//                     <FormFeedback>{formErrors.username}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label className="fw-semibold small">Email</Label>
//                     <Input type="email" value={formState.email} invalid={Boolean(formErrors.email)} onChange={setField("email")} />
//                     <FormFeedback>{formErrors.email}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <FormGroup className="mb-0">
//                     <Label className="fw-semibold small">Phone</Label>
//                     <Input value={formState.phone} invalid={Boolean(formErrors.phone)} onChange={setField("phone")} />
//                     <FormFeedback>{formErrors.phone}</FormFeedback>
//                   </FormGroup>
//                 </Col>
//                 <Col md={6}>
//                   <div className="border rounded-3 px-3 py-2 h-100 d-flex align-items-center justify-content-between gap-3">
//                     <div>
//                       <Label className="mb-0 fw-semibold small d-block">2FA</Label>
//                       <small className="text-muted">Two-factor auth</small>
//                     </div>
//                     <Input
//                       type="switch"
//                       className="flex-shrink-0"
//                       checked={formState.twoFactorEnabled}
//                       onChange={(e) => setFormState((prev) => ({ ...prev, twoFactorEnabled: e.target.checked }))}
//                     />
//                   </div>
//                 </Col>
//               </Row>
//             </ModalBody>

//             <ModalFooter className="border-top pt-3 gap-2">
//               <Button color="light" onClick={() => setIsEditOpen(false)}>Cancel</Button>
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