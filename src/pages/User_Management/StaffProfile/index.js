import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Progress,
  Button,
  Tooltip,
  ListGroup,
  ListGroupItem,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import { getStaffProfile, toggleStaff2FA } from "../../../helpers/backend_helper";

import { useFormik } from "formik";
import * as Yup from "yup";
import { updateStaff } from "../../../slices/thunks";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  Input,
  FormFeedback,
  ModalFooter
} from "reactstrap";

const StaffProfile = () => {
  document.title = "Staff Profile | Kamacash";

  const dispatch = useDispatch();
  const authUser = useAuthUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const staffId = authUser?.staffId;

  // Validation Schema
  const validationSchema = Yup.object({
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string().required("Last Name is required"),
    phone: Yup.string().required("Phone is required"),
    countryCode: Yup.string(),
    username: Yup.string().required("Username is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
      countryCode: profile?.countryCode || "+1",
      username: profile?.username || "",
      email: profile?.email || "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const updateData = {
          _id: staffId,
          ...values,
        };
        await dispatch(updateStaff(updateData));
        toast.success("Profile updated successfully");
        setIsEdit(false);
        // Refresh profile data
        const freshProfile = await getStaffProfile(staffId);
        if (freshProfile?.success) {
          setProfile(freshProfile.data);
        }
      } catch (err) {
        toast.error("Failed to update profile");
        console.error(err);
      }
    },
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!staffId) {
        setError("Staff ID not found. Please sign in again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getStaffProfile(staffId);
        if (response?.success) {
          if (isMounted) {
            setProfile(response.data || null);
          }
        } else {
          if (isMounted) {
            setError(response?.message || "Failed to load staff profile");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load staff profile");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [staffId]);

  const fullName = useMemo(() => {
    if (!profile) return "-";
    if (profile.fullName) return profile.fullName;
    const first = profile.firstName || "";
    const last = profile.lastName || "";
    return `${first} ${last}`.trim() || "-";
  }, [profile]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(value).split(",")[0];
  };

  const toTitleCase = (value) => {
    if (!value || typeof value !== "string") return "-";
    return value
      .split("_")
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
      .join(" ");
  };

  const initials = useMemo(() => {
    const baseName = fullName && fullName !== "-" ? fullName : profile?.username || "ST";
    return baseName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [fullName, profile?.username]);

  const getAvatarColor = useMemo(() => {
    const colors = [
      "bg-primary",
    ];
    if (!profile?.username) return colors[0];
    const index = profile.username.length % colors.length;
    return colors[index];
  }, [profile?.username]);

  const statusBadge = (value, trueLabel, falseLabel) => (
    <Badge
      color={value ? "success" : "secondary"}
      pill
      className={`px-3 py-2 ${value ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}
      style={{ fontSize: "0.75rem", fontWeight: "500" }}
    >
      <span className={`d-inline-block rounded-circle me-1`} style={{
        width: "8px",
        height: "8px",
        backgroundColor: value ? "#338427" : "#6c757d",
        boxShadow: value ? "0 0 0 2px rgba(16,185,129,0.2)" : "none"
      }}></span>
      {value ? trueLabel : falseLabel}
    </Badge>
  );

  const roleBadge = (role) => {
    const roleConfig = {
      ADMIN: { color: "danger", icon: "ri-admin-line" },
      MANAGER: { color: "warning", icon: "ri-user-star-line" },
      STAFF: { color: "info", icon: "ri-user-settings-line" },
      SUPER_ADMIN: { color: "primary", icon: "ri-shield-user-line" },
    };
    const config = roleConfig[role] || { color: "secondary", icon: "ri-user-line" };
    return (
      <Badge
        color={config.color}
        pill
        className="px-3 py-2 bg-opacity-10 text-dark border-0"
        style={{ backgroundColor: `var(--bs-${config.color}-bg-subtle)`, fontWeight: "500" }}
      >
        <i className={`${config.icon} me-1`}></i>
        {toTitleCase(role)}
      </Badge>
    );
  };

  const getSecurityScore = useMemo(() => {
    let score = 0;
    if (profile?.twoFactorEnabled) score += 40;
    if (profile?.isAdminApproved) score += 30;
    if (profile?.email) score += 15;
    if (profile?.phone) score += 15;
    return score;
  }, [profile]);

  const toggleEdit = () => {
    setIsEdit(!isEdit);
    if (!isEdit) validation.resetForm();
  };


  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Staff Profile" pageTitle="Users" />

        {loading ? (
          <Loader />
        ) : error ? (
          <Alert color="danger" className="mb-0">
            <i className="ri-error-warning-line me-2"></i>
            {error}
          </Alert>
        ) : (
          <>
            {/* Profile Header Card with Cover */}
            <Card className="overflow-hidden border-0 shadow-sm mb-4">
              <div
                className="position-relative"
                style={{
                  height: "180px",
                  background: "linear-gradient(135deg, #338427 0%, #E36814 100%)",
                }}
              >
                {/* ... decorative svg ... */}
                <svg className="position-absolute w-100 h-100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="pattern-1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)" />
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-1)" />
                </svg>

                <div className="position-absolute top-0 end-0 p-3">
                  <Button color="light" size="sm" onClick={toggleEdit}>
                    <i className="ri-edit-line me-1"></i> Edit Profile
                  </Button>
                </div>
              </div>

              <CardBody className="pt-0">
                {/* ... existing card body content ... */}
                <div className="d-flex flex-wrap align-items-end justify-content-between">
                  <div className="d-flex align-items-end gap-4">
                    {/* Avatar with ring */}
                    <div className="position-relative" style={{ marginTop: "-50px" }}>
                      <div className="bg-white rounded-circle p-1 shadow-lg">
                        <div
                          className={`${getAvatarColor} rounded-circle d-flex align-items-center justify-content-center text-white fw-bold`}
                          style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
                        >
                          {initials || "ST"}
                        </div>
                      </div>
                      {profile?.isActive && (
                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-2 border-white">
                          <div style={{ width: "12px", height: "12px" }}></div>
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="mb-2">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h1 className="display-6 fw-bold mb-0">{fullName}</h1>
                        {roleBadge(profile?.role)}
                      </div>
                      <div className="d-flex flex-wrap gap-3">
                        <div className="d-flex align-items-center text-muted">
                          <i className="ri-at-line me-1"></i>
                          {profile?.username || "-"}
                        </div>
                        <div className="d-flex align-items-center text-muted">
                          <i className="ri-mail-line me-1"></i>
                          {profile?.email || "-"}
                        </div>
                        {profile?.phone && (
                          <div className="d-flex align-items-center text-muted">
                            <i className="ri-phone-line me-1"></i>
                            {profile?.countryCode || ""} {profile?.phone || "-"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* ... Rest of existing JSX ... */}
            <Row className="g-4 mb-4">
              {/* ... Stats Cards ... */}
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <div className="avatar-title bg-primary-subtle text-primary rounded-3 fs-3">
                            <i className="ri-shield-user-line"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="text-muted mb-1">Account Status</h6>
                        <div className="d-flex align-items-center">
                          {statusBadge(profile?.isActive, "Active", "Inactive")}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <div className="avatar-title bg-success-subtle text-success rounded-3 fs-3">
                            <i className="ri-shield-check-line"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="text-muted mb-1">Admin Approval</h6>
                        <div className="d-flex align-items-center">
                          {statusBadge(profile?.isAdminApproved, "Approved", "Pending")}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <div className="avatar-title bg-info-subtle text-info rounded-3 fs-3">
                            <i className="ri-lock-password-line"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="text-muted mb-1">Two Factor</h6>
                        <div className="d-flex align-items-center">
                          {statusBadge(profile?.twoFactorEnabled, "Enabled", "Disabled")}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <div className="avatar-title bg-warning-subtle text-warning rounded-3 fs-3">
                            <i className="ri-calendar-line"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="text-muted mb-1">Last Login</h6>
                        <div className="fw-semibold">
                          {formatRelativeTime(profile?.lastLogin)}
                        </div>
                        <small className="text-muted">{formatDate(profile?.lastLogin).split(",")[1]}</small>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Row className="g-4">
              {/* Left Column - Profile Details */}
              <Col xl={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <div className="avatar-title bg-light text-primary rounded-circle">
                            <i className="ri-user-settings-line fs-4"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5 className="card-title mb-1">Profile Details</h5>
                        <p className="text-muted small mb-0">
                          Personal information and account settings
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="p-4">
                    <Row className="g-4">
                      <Col md={6}>
                        <div className="border-bottom pb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="ri-user-line me-1"></i> First Name
                          </small>
                          <div className="fw-semibold fs-6">{profile?.firstName || "-"}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="border-bottom pb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="ri-user-line me-1"></i> Last Name
                          </small>
                          <div className="fw-semibold fs-6">{profile?.lastName || "-"}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="border-bottom pb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="ri-at-line me-1"></i> Username
                          </small>
                          <div className="fw-semibold fs-6">{profile?.username || "-"}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="border-bottom pb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="ri-mail-line me-1"></i> Email Address
                          </small>
                          <div className="fw-semibold fs-6">{profile?.email || "-"}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="border-bottom pb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="ri-phone-line me-1"></i> Phone Number
                          </small>
                          <div className="fw-semibold fs-6">
                            {profile?.countryCode || ""}
                            {profile?.phone ? ` ${profile.phone}` : "-"}
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="border-bottom pb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="ri-genderless-line me-1"></i> Gender
                          </small>
                          <div className="fw-semibold fs-6">
                            <Badge
                              color={
                                profile?.sex === "MALE"
                                  ? "primary"
                                  : profile?.sex === "FEMALE"
                                    ? "danger"
                                    : "secondary"
                              }
                              pill
                              className="px-3 py-2 bg-opacity-10 text-dark border-0"
                            >
                              <i className={`me-1 ${profile?.sex === "MALE"
                                ? "ri-men-line"
                                : profile?.sex === "FEMALE"
                                  ? "ri-women-line"
                                  : "ri-user-line"
                                }`}></i>
                              {toTitleCase(profile?.sex)}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="border-top pt-3 mt-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1"><i className="ri-shield-keyhole-line me-1"></i> Two-Factor Authentication</h6>
                              <p className="text-muted small mb-0">Secure your account with 2FA</p>
                            </div>
                            <div className="form-check form-switch form-switch-lg">
                              <Input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="flexSwitchCheckDefault"
                                checked={profile?.twoFactorEnabled || false}
                                onChange={async (e) => {
                                  const newStatus = e.target.checked;
                                  try {
                                    await toggleStaff2FA(newStatus);
                                    toast.success(`Two-Factor Authentication ${newStatus ? 'enabled' : 'disabled'}`);
                                    setProfile(prev => ({ ...prev, twoFactorEnabled: newStatus }));
                                  } catch (err) {
                                    toast.error("Failed to update 2FA status");
                                    // Revert switch if failed ?? actually better to just not update state if failed, but here we update state after success
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>

              {/* Security & Activity Col -> Now Activity Timeline Only */}
              <Col xl={6}>
                {/* Security Score - HIDDEN as per request */}
                {/* <Card className="border-0 shadow-sm mb-4"> ... </Card> */}

                {/* Security Settings - HIDDEN as per request */}
                {/* <Card className="border-0 shadow-sm mb-4"> ... </Card> */}

                {/* Activity Timeline Card */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <div className="avatar-title bg-light text-info rounded-circle">
                            <i className="ri-history-line fs-4"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">Activity Timeline</h6>
                        <p className="text-muted small mb-0">Recent account activity</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="p-4">
                    <div className="position-relative ps-3">
                      {/* Timeline Line */}
                      <div className="position-absolute start-0 top-0 bottom-0" style={{ width: "2px", background: "linear-gradient(180deg, #0ab39c 0%, #e9e9e9 100%)" }}></div>

                      {/* Last Login */}
                      <div className="mb-4 position-relative">
                        <div className="position-absolute start-0 translate-middle-x bg-success rounded-circle" style={{ width: "12px", height: "12px", left: "-5px", top: "5px", border: "2px solid white" }}></div>
                        <div className="ms-4">
                          <h6 className="mb-1">Last Login</h6>
                          <p className="text-muted small mb-1">{formatDate(profile?.lastLogin)}</p>
                          <Badge color="light" className="text-dark">
                            {formatRelativeTime(profile?.lastLogin)}
                          </Badge>
                        </div>
                      </div>

                      {/* Account Created */}
                      <div className="mb-4 position-relative">
                        <div className="position-absolute start-0 translate-middle-x bg-primary rounded-circle" style={{ width: "12px", height: "12px", left: "-5px", top: "5px", border: "2px solid white" }}></div>
                        <div className="ms-4">
                          <h6 className="mb-1">Account Created</h6>
                          <p className="text-muted small mb-1">{formatDate(profile?.createdAt)}</p>
                          <Badge color="light" className="text-dark">
                            {formatRelativeTime(profile?.createdAt)}
                          </Badge>
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="position-relative">
                        <div className="position-absolute start-0 translate-middle-x bg-warning rounded-circle" style={{ width: "12px", height: "12px", left: "-5px", top: "5px", border: "2px solid white" }}></div>
                        <div className="ms-4">
                          <h6 className="mb-1">Last Updated</h6>
                          <p className="text-muted small mb-1">{formatDate(profile?.updatedAt)}</p>
                          <Badge color="light" className="text-dark">
                            {formatRelativeTime(profile?.updatedAt)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Edit Profile Modal */}
        <Modal isOpen={isEdit} toggle={toggleEdit} centered>
          <ModalHeader toggle={toggleEdit}>Edit Profile</ModalHeader>
          <Form onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            return false;
          }}>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label htmlFor="username" className="form-label">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      className="form-control"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.username || ""}
                      invalid={validation.touched.username && validation.errors.username ? true : false}
                    />
                    {validation.touched.username && validation.errors.username ? (
                      <FormFeedback type="invalid">{validation.errors.username}</FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label htmlFor="email" className="form-label">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.email || ""}
                      invalid={validation.touched.email && validation.errors.email ? true : false}
                    />
                    {validation.touched.email && validation.errors.email ? (
                      <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label htmlFor="firstName" className="form-label">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      className="form-control"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.firstName || ""}
                      invalid={validation.touched.firstName && validation.errors.firstName ? true : false}
                    />
                    {validation.touched.firstName && validation.errors.firstName ? (
                      <FormFeedback type="invalid">{validation.errors.firstName}</FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label htmlFor="lastName" className="form-label">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      className="form-control"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.lastName || ""}
                      invalid={validation.touched.lastName && validation.errors.lastName ? true : false}
                    />
                    {validation.touched.lastName && validation.errors.lastName ? (
                      <FormFeedback type="invalid">{validation.errors.lastName}</FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={12}>
                  <div className="mb-3">
                    <Label htmlFor="phone" className="form-label">Phone Number</Label>
                    <div className="input-group">
                      <Input
                        id="countryCode"
                        name="countryCode"
                        type="text"
                        className="form-control"
                        style={{ maxWidth: '80px' }}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.countryCode || ""}
                      />
                      <Input
                        id="phone"
                        name="phone"
                        type="text"
                        className="form-control"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.phone || ""}
                        invalid={validation.touched.phone && validation.errors.phone ? true : false}
                      />
                      {validation.touched.phone && validation.errors.phone ? (
                        <FormFeedback type="invalid">{validation.errors.phone}</FormFeedback>
                      ) : null}
                    </div>
                  </div>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="light" onClick={toggleEdit}>Cancel</Button>
              <Button color="primary" type="submit">Save Changes</Button>
            </ModalFooter>
          </Form>
        </Modal>

      </Container>

      <style jsx>{`
        .bg-purple {
          background-color: #338427;
        }
        .bg-opacity-10 {
          --bs-bg-opacity: 0.1;
        }
        .bg-primary-subtle {
          background-color: rgba(13, 110, 253, 0.1);
        }
        .bg-success-subtle {
          background-color: rgba(16, 185, 129, 0.1);
        }
        .bg-info-subtle {
          background-color: rgba(13, 202, 240, 0.1);
        }
        .bg-warning-subtle {
          background-color: rgba(255, 193, 7, 0.1);
        }
        .avatar-xl {
          width: 100px;
          height: 100px;
        }
        .avatar-xl .avatar-title {
          width: 100px;
          height: 100px;
          font-size: 2rem;
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
//   Card,
//   CardBody,
//   CardHeader,
//   Col,
//   Container,
//   Row,
// } from "reactstrap";
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import Loader from "../../../Components/Common/Loader";
// import useAuthUser from "../../../Components/Hooks/useAuthUser";
// import { getStaffProfile } from "../../../helpers/backend_helper";

// const StaffProfile = () => {
//   document.title = "Staff Profile | Kamacash";

//   const authUser = useAuthUser();
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const staffId = authUser?.staffId;

//   useEffect(() => {
//     let isMounted = true;

//     const fetchProfile = async () => {
//       if (!staffId) {
//         setError("Staff ID not found. Please sign in again.");
//         setLoading(false);
//         return;
//       }

//       setLoading(true);
//       setError("");

//       try {
//         const response = await getStaffProfile(staffId);
//         if (response?.success) {
//           if (isMounted) {
//             setProfile(response.data || null);
//           }
//         } else {
//           if (isMounted) {
//             setError(response?.message || "Failed to load staff profile");
//           }
//         }
//       } catch (err) {
//         if (isMounted) {
//           setError(err?.message || "Failed to load staff profile");
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchProfile();

//     return () => {
//       isMounted = false;
//     };
//   }, [staffId]);

//   const fullName = useMemo(() => {
//     if (!profile) return "-";
//     if (profile.fullName) return profile.fullName;
//     const first = profile.firstName || "";
//     const last = profile.lastName || "";
//     return `${first} ${last}`.trim() || "-";
//   }, [profile]);

//   const formatDate = (value) => {
//     if (!value) return "-";
//     const date = new Date(value);
//     if (Number.isNaN(date.getTime())) return "-";
//     return date.toLocaleString();
//   };

//   const toTitleCase = (value) => {
//     if (!value || typeof value !== "string") return "-";
//     return value
//       .split("_")
//       .map((item) => item.charAt(0) + item.slice(1).toLowerCase())
//       .join(" ");
//   };

//   const initials = useMemo(() => {
//     const baseName = fullName && fullName !== "-" ? fullName : profile?.username || "ST";
//     return baseName
//       .split(" ")
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((part) => part[0]?.toUpperCase())
//       .join("");
//   }, [fullName, profile?.username]);

//   const statusBadge = (value, trueLabel, falseLabel) => (
//     <Badge color={value ? "success" : "danger"} pill>
//       {value ? trueLabel : falseLabel}
//     </Badge>
//   );

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Staff Profile" pageTitle="Users" />

//         {loading ? (
//           <Loader />
//         ) : error ? (
//           <Alert color="danger" className="mb-0">
//             {error}
//           </Alert>
//         ) : (
//           <>
//             <Card className="overflow-hidden">
//               <CardBody className="bg-light-subtle border-bottom">
//                 <Row className="align-items-center gy-3">
//                   <Col lg={8}>
//                     <div className="d-flex align-items-center">
//                       <div className="flex-shrink-0">
//                         <div
//                           className="avatar-lg rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold fs-3"
//                           style={{ width: 64, height: 64 }}
//                         >
//                           {initials || "ST"}
//                         </div>
//                       </div>
//                       <div className="flex-grow-1 ms-3">
//                         <h4 className="mb-1">{fullName}</h4>
//                         <div className="d-flex flex-wrap gap-2 mb-2">
//                           <Badge color="primary" pill>
//                             {toTitleCase(profile?.role)}
//                           </Badge>
//                           {statusBadge(profile?.isActive, "Active", "Inactive")}
//                         </div>
//                         <p className="text-muted mb-1">
//                           <i className="ri-at-line align-middle me-1"></i>
//                           {profile?.username || "-"}
//                         </p>
//                         <p className="text-muted mb-0">
//                           <i className="ri-mail-line align-middle me-1"></i>
//                           {profile?.email || "-"}
//                         </p>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col lg={4}>
//                     <Row className="g-2">
//                       <Col xs={12}>
//                         <div className="border rounded-3 p-2 bg-white">
//                           <small className="text-muted d-block">Last Login</small>
//                           <span className="fw-semibold">{formatDate(profile?.lastLogin)}</span>
//                         </div>
//                       </Col>
//                       <Col xs={6}>
//                         <div className="border rounded-3 p-2 bg-white h-100">
//                           <small className="text-muted d-block">2FA</small>
//                           <span className="fw-semibold">
//                             {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
//                           </span>
//                         </div>
//                       </Col>
//                       <Col xs={6}>
//                         <div className="border rounded-3 p-2 bg-white h-100">
//                           <small className="text-muted d-block">Approval</small>
//                           <span className="fw-semibold">
//                             {profile?.isAdminApproved ? "Approved" : "Pending"}
//                           </span>
//                         </div>
//                       </Col>
//                     </Row>
//                   </Col>
//                 </Row>
//               </CardBody>
//             </Card>

//             <Row>
//               <Col xl={8}>
//                 <Card>
//                   <CardHeader className="bg-light">
//                     <h5 className="card-title mb-0">
//                       <i className="ri-user-settings-line me-2"></i>
//                       Profile Details
//                     </h5>
//                   </CardHeader>
//                   <CardBody>
//                     <Row className="gy-3">
//                       <Col md={6}>
//                         <div className="text-muted mb-1">First Name</div>
//                         <div className="fw-semibold">{profile?.firstName || "-"}</div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Last Name</div>
//                         <div className="fw-semibold">{profile?.lastName || "-"}</div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Username</div>
//                         <div className="fw-semibold">{profile?.username || "-"}</div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Email</div>
//                         <div className="fw-semibold">{profile?.email || "-"}</div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Phone</div>
//                         <div className="fw-semibold">
//                           {profile?.countryCode || ""}
//                           {profile?.phone ? ` ${profile.phone}` : "-"}
//                         </div>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Sex</div>
//                         <Badge
//                           color={
//                             profile?.sex === "MALE"
//                               ? "primary"
//                               : profile?.sex === "FEMALE"
//                                 ? "success"
//                                 : "secondary"
//                           }
//                           pill
//                         >
//                           {toTitleCase(profile?.sex)}
//                         </Badge>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Role</div>
//                         <Badge color="info" pill>
//                           {toTitleCase(profile?.role)}
//                         </Badge>
//                       </Col>
//                       <Col md={6}>
//                         <div className="text-muted mb-1">Account Status</div>
//                         {statusBadge(profile?.isActive, "Active", "Inactive")}
//                       </Col>
//                     </Row>
//                   </CardBody>
//                 </Card>
//               </Col>

//               <Col xl={4}>
//                 <Card className="mb-3">
//                   <CardHeader className="bg-light">
//                     <h5 className="card-title mb-0">
//                       <i className="ri-shield-check-line me-2"></i>
//                       Security
//                     </h5>
//                   </CardHeader>
//                   <CardBody>
//                     <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
//                       <div>
//                         <p className="text-muted mb-1">Two Factor</p>
//                         <h6 className="mb-0">Additional Login Protection</h6>
//                       </div>
//                       {statusBadge(profile?.twoFactorEnabled, "Enabled", "Disabled")}
//                     </div>
//                     <div className="d-flex justify-content-between align-items-center">
//                       <div>
//                         <p className="text-muted mb-1">Admin Approval</p>
//                         <h6 className="mb-0">Profile Verification</h6>
//                       </div>
//                       {statusBadge(profile?.isAdminApproved, "Approved", "Pending")}
//                     </div>
//                   </CardBody>
//                 </Card>

//                 <Card>
//                   <CardHeader className="bg-light">
//                     <h5 className="card-title mb-0">
//                       <i className="ri-time-line me-2"></i>
//                       Activity Timeline
//                     </h5>
//                   </CardHeader>
//                   <CardBody>
//                     <div className="mb-3 pb-3 border-bottom">
//                       <small className="text-muted d-block">Last Login</small>
//                       <span className="fw-semibold">{formatDate(profile?.lastLogin)}</span>
//                     </div>
//                     <div className="mb-3 pb-3 border-bottom">
//                       <small className="text-muted d-block">Created At</small>
//                       <span className="fw-semibold">{formatDate(profile?.createdAt)}</span>
//                     </div>
//                     <div>
//                       <small className="text-muted d-block">Updated At</small>
//                       <span className="fw-semibold">{formatDate(profile?.updatedAt)}</span>
//                     </div>
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>
//           </>
//         )}
//       </Container>
//     </div>
//   );
// };

// export default StaffProfile;
