import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Progress,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getBusinessProfile,
  getStaffProfile,
  updateBusinessProfile,
} from "../../../helpers/backend_helper";

const defaultHours = {
  open: "",
  close: "",
};

const days = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thur", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const BusinessProfileSettings = () => {
  document.title = "Business Profile Settings | Kamacash";

  const authUser = useAuthUser();
  const businessId = authUser?.businessId;
  const [resolvedBusinessId, setResolvedBusinessId] = useState(businessId || "");
  const [activeTab, setActiveTab] = useState("1");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const resolveBusinessId = async () => {
      if (businessId) {
        setResolvedBusinessId(businessId);
        return;
      }

      if (!authUser?.staffId) {
        setError("Business ID not found. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const staffResponse = await getStaffProfile(authUser.staffId);
        const staffBusinessId = staffResponse?.data?.business?._id || "";
        if (staffBusinessId && isMounted) {
          setResolvedBusinessId(staffBusinessId);
        } else if (isMounted) {
          setError("Business ID not found. Please sign in again.");
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to resolve business ID");
          setLoading(false);
        }
      }
    };

    resolveBusinessId();

    return () => {
      isMounted = false;
    };
  }, [authUser?.staffId, businessId]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!resolvedBusinessId) return;

      setLoading(true);
      setError("");

      try {
        const response = await getBusinessProfile(resolvedBusinessId);
        if (response?.success) {
          if (isMounted) {
            const data = response.data || null;
            setProfile(data);
            setLogoPreview(data?.logo || "");
            setBannerPreview(data?.bannerImage || "");
          }
        } else if (isMounted) {
          setError(response?.message || "Failed to load business profile");
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load business profile");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [resolvedBusinessId]);

  useEffect(() => {
    if (profile?.logo instanceof File) {
      const previewUrl = URL.createObjectURL(profile.logo);
      setLogoPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
    setLogoPreview(profile?.logo || "");
    return undefined;
  }, [profile?.logo]);

  useEffect(() => {
    if (profile?.bannerImage instanceof File) {
      const previewUrl = URL.createObjectURL(profile.bannerImage);
      setBannerPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
    setBannerPreview(profile?.bannerImage || "");
    return undefined;
  }, [profile?.bannerImage]);

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFieldChange("logo", file);
    }
  };

  const handleBannerFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFieldChange("bannerImage", file);
    }
  };

  const handleFieldChange = (key, value) => {
    setProfile((prev) => ({
      ...(prev || {}),
      [key]: value,
    }));
  };

  const handleAddressChange = (key, value) => {
    setProfile((prev) => ({
      ...(prev || {}),
      address: {
        ...(prev?.address || {}),
        [key]: value,
      },
    }));
  };

  const handleHoursChange = (dayKey, fieldKey, value) => {
    setProfile((prev) => ({
      ...(prev || {}),
      openingHours: {
        ...(prev?.openingHours || {}),
        [dayKey]: {
          ...(prev?.openingHours?.[dayKey] || defaultHours),
          [fieldKey]: value,
        },
      },
    }));
  };

  const hoursValue = useMemo(() => profile?.openingHours || {}, [profile]);

  const completionStats = useMemo(() => {
    const checks = [
      { field: profile?.businessName, label: "Business Name", weight: 15 },
      { field: profile?.email, label: "Email", weight: 10 },
      { field: profile?.phoneNumber, label: "Phone", weight: 10 },
      { field: profile?.description, label: "Description", weight: 15 },
      { field: profile?.address?.street, label: "Address", weight: 10 },
      { field: profile?.logo, label: "Logo", weight: 20 },
      { field: profile?.bannerImage, label: "Banner", weight: 20 },
    ];

    const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = checks.reduce((sum, item) =>
      item.field ? sum + item.weight : sum, 0);

    const completed = checks.filter(item => item.field).length;

    return {
      completed,
      total: checks.length,
      percentage: Math.round((completedWeight / totalWeight) * 100),
      weightedPercentage: Math.round((completedWeight / totalWeight) * 100),
      items: checks
    };
  }, [profile]);

  const formatTimeDisplay = (value) => {
    if (!value) return "Closed";
    return value;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedBusinessId) {
      setError("Business ID not found. Please sign in again.");
      return;
    }

    const submitData = new FormData();
    submitData.append("businessName", profile?.businessName || "");
    submitData.append("description", profile?.description || "");
    submitData.append("phoneNumber", profile?.phoneNumber || "");
    submitData.append("email", profile?.email || "");
    submitData.append("address[street]", profile?.address?.street || "");

    if (profile?.logo instanceof File) {
      submitData.append("logo", profile.logo);
    } else if (profile?.logo) {
      submitData.append("logo", profile.logo);
    }

    if (profile?.bannerImage instanceof File) {
      submitData.append("bannerImage", profile.bannerImage);
    } else if (profile?.bannerImage) {
      submitData.append("bannerImage", profile.bannerImage);
    }

    Object.keys(profile?.openingHours || {}).forEach((day) => {
      const openTime = profile?.openingHours?.[day]?.open || "";
      const closeTime = profile?.openingHours?.[day]?.close || "";
      submitData.append(`openingHours[${day}][open]`, openTime);
      submitData.append(`openingHours[${day}][close]`, closeTime);
    });

    setSaving(true);
    setError("");

    try {
      const response = await updateBusinessProfile(resolvedBusinessId, submitData);
      if (response?.success) {
        toast.success("Business profile updated successfully");
        // Refresh profile data
        const refreshResponse = await getBusinessProfile(resolvedBusinessId);
        if (refreshResponse?.success) {
          setProfile(refreshResponse.data);
        }
      } else {
        setError(response?.message || "Failed to update business profile");
        toast.error(response?.message || "Failed to update business profile");
      }
    } catch (err) {
      setError(err?.message || "Failed to update business profile");
      toast.error(err?.message || "Failed to update business profile");
    } finally {
      setSaving(false);
    }
  };

  // Get completion status color
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "danger";
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Business Profile Settings" pageTitle="Business" />
        <ToastContainer position="top-right" />

        {loading ? (
          <Loader />
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && (
              <Alert color="danger" className="mb-4">
                <i className="ri-error-warning-line me-2"></i>
                {error}
              </Alert>
            )}

            {/* Banner Section - Full Width */}
            <Card className="overflow-hidden mb-4 border-0 shadow-sm">
              <div className="position-relative">
                {/* Banner Image */}
                <div
                  className="position-relative"
                  style={{
                    height: "280px",
                    background: bannerPreview
                      ? `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%), url(${bannerPreview})`
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundSize: bannerPreview ? "contain" : "cover",
                    backgroundRepeat: "no-repeat",

                    backgroundPosition: "center",
                  }}
                >
                  {/* Banner Overlay Controls */}
                  <div className="position-absolute bottom-0 end-0 p-4">
                    <Button
                      type="button"
                      color="light"
                      className="shadow-sm me-2"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      <i className="ri-image-edit-line me-2"></i>
                      Change Banner
                    </Button>
                    <Input
                      innerRef={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="d-none"
                    />
                  </div>
                </div>

                {/* Logo and Business Info Overlay */}
                <div className="position-absolute bottom-0 start-0 p-4 w-100">
                  <div className="d-flex align-items-end gap-4">
                    {/* Logo */}
                    <div className="position-relative">
                      <div
                        className="bg-white rounded-4 shadow-lg d-flex align-items-center justify-content-center"
                        style={{
                          width: "120px",
                          height: "120px",
                          border: "4px solid white",
                          overflow: "hidden",
                        }}
                      >
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Business Logo"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <i className="ri-store-2-line text-primary fs-1"></i>
                        )}
                      </div>
                      <Button
                        type="button"
                        color="primary"
                        size="sm"
                        className="position-absolute bottom-0 end-0 rounded-circle p-2"
                        style={{ transform: "translateY(25%)" }}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <i className="ri-pencil-line"></i>
                      </Button>
                      <Input
                        innerRef={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="d-none"
                      />
                    </div>

                    {/* Business Info */}
                    <div className="pb-2">
                      <h1 className="display-6 fw-bold mb-2 text-white">
                        {profile?.businessName || "Business Name"}
                      </h1>
                      <div className="d-flex align-items-center gap-3">
                        <Badge color="primary" pill className="px-3 py-2">
                          <i className="ri-mail-line me-1"></i>
                          {profile?.email || "No email"}
                        </Badge>
                        {profile?.phoneNumber && (
                          <Badge color="primary" pill className="px-3 py-2">
                            <i className="ri-phone-line me-1"></i>
                            {profile.phoneNumber}
                          </Badge>
                        )}
                        {profile?.address?.street && (
                          <Badge color="primary" pill className="px-3 py-2">
                            <i className="ri-map-pin-line me-1"></i>
                            {profile.address.street}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Completion Stats Card */}
            <Card className="mb-4 border-0 shadow-sm">
              <CardBody className="p-4">
                <Row className="align-items-center g-4">
                  <Col lg={4}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="position-relative">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "80px",
                            height: "80px",
                            background: `conic-gradient(${getCompletionColor(completionStats.percentage) === "success"
                              ? "#338427"
                              : getCompletionColor(completionStats.percentage) === "warning"
                                ? "#f59e0b"
                                : "#ef4444"
                              } ${completionStats.percentage}%, #e9e9e9 0deg)`,
                          }}
                        >
                          <div
                            className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "64px", height: "64px" }}
                          >
                            <span className="fs-4 fw-bold text-dark">
                              {completionStats.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-1">Profile Completion</h5>
                        <p className="text-muted mb-0">
                          {completionStats.completed} of {completionStats.total} fields completed
                        </p>
                      </div>
                    </div>
                  </Col>
                  <Col lg={8}>
                    <div className="d-flex flex-wrap gap-3">
                      {completionStats.items.map((item, index) => (
                        <div key={index} className="d-flex align-items-center gap-2">
                          <div
                            className={`rounded-circle ${item.field ? "bg-success" : "bg-light"
                              }`}
                            style={{ width: "10px", height: "10px" }}
                          ></div>
                          <small className={item.field ? "text-dark" : "text-muted"}>
                            {item.label}
                          </small>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Main Content Tabs */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white border-0 pt-4 px-4">
                <Nav tabs className="nav-tabs-custom">
                  <NavItem>
                    <NavLink
                      className={activeTab === "1" ? "active" : ""}
                      onClick={() => setActiveTab("1")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="ri-building-line me-2"></i>
                      Business Information
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === "2" ? "active" : ""}
                      onClick={() => setActiveTab("2")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="ri-time-line me-2"></i>
                      Operating Hours
                    </NavLink>
                  </NavItem>
                </Nav>
              </CardHeader>
              <CardBody className="p-4">
                <TabContent activeTab={activeTab}>
                  {/* Tab 1: Business Information */}
                  <TabPane tabId="1">
                    <Row className="g-4">
                      <Col lg={8}>
                        <Card className="border-0 shadow-none">
                          <CardHeader className="bg-transparent border-0 px-0 pt-0">
                            <h5 className="card-title mb-0">Basic Information</h5>
                            <p className="text-muted small mb-0">
                              Update your business details and contact information
                            </p>
                          </CardHeader>
                          <CardBody className="px-0">
                            <Row className="g-4">
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="businessName" className="fw-semibold">
                                    Business Name <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    id="businessName"
                                    type="text"
                                    value={profile?.businessName || ""}
                                    onChange={(e) =>
                                      handleFieldChange("businessName", e.target.value)
                                    }
                                    placeholder="Enter business name"
                                    className="form-control-lg"
                                  />
                                </FormGroup>
                              </Col>
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="email" className="fw-semibold">
                                    Email Address <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={profile?.email || ""}
                                    onChange={(e) =>
                                      handleFieldChange("email", e.target.value)
                                    }
                                    placeholder="Enter email address"
                                    className="form-control-lg"
                                  />
                                </FormGroup>
                              </Col>
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="phoneNumber" className="fw-semibold">
                                    Phone Number <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    id="phoneNumber"
                                    type="tel"
                                    value={profile?.phoneNumber || ""}
                                    onChange={(e) =>
                                      handleFieldChange("phoneNumber", e.target.value)
                                    }
                                    placeholder="Enter phone number"
                                    className="form-control-lg"
                                  />
                                </FormGroup>
                              </Col>
                              <Col md={12}>
                                <FormGroup>
                                  <Label for="description" className="fw-semibold">
                                    Business Description
                                  </Label>
                                  <Input
                                    id="description"
                                    type="textarea"
                                    rows="4"
                                    value={profile?.description || ""}
                                    onChange={(e) =>
                                      handleFieldChange("description", e.target.value)
                                    }
                                    placeholder="Tell customers about your business..."
                                    className="form-control-lg"
                                  />
                                  <small className="text-muted">
                                    {profile?.description?.length || 0}/500 characters
                                  </small>
                                </FormGroup>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>

                        <Card className="border-0 shadow-none">
                          <CardHeader className="bg-transparent border-0 px-0">
                            <h5 className="card-title mb-0">Address Information</h5>
                            <p className="text-muted small mb-0">
                              Your business location for customers
                            </p>
                          </CardHeader>
                          <CardBody className="px-0">
                            <Row className="g-4">
                              <Col md={12}>
                                <FormGroup>
                                  <Label for="street" className="fw-semibold">
                                    Street Address
                                  </Label>
                                  <Input
                                    id="street"
                                    type="text"
                                    value={profile?.address?.street || ""}
                                    onChange={(e) =>
                                      handleAddressChange("street", e.target.value)
                                    }
                                    placeholder="Enter street address"
                                    className="form-control-lg"
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>
                      </Col>

                      {/* Brand Media Sidebar */}
                      <Col lg={4}>
                        <Card className="border-0 bg-light shadow-none">
                          <CardBody className="p-4">
                            <h5 className="card-title mb-3">Brand Assets</h5>
                            <p className="text-muted small mb-4">
                              High-quality images help build trust and recognition
                            </p>

                            <div className="mb-4">
                              <Label className="fw-semibold mb-3">Business Logo</Label>
                              <div className="text-center">
                                <div
                                  className="mx-auto mb-3 rounded-4 border bg-white d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "160px",
                                    height: "160px",
                                    margin: "0 auto",
                                  }}
                                >
                                  {logoPreview ? (
                                    <img
                                      src={logoPreview}
                                      alt="Logo"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        padding: "12px",
                                      }}
                                    />
                                  ) : (
                                    <i className="ri-store-2-line text-primary" style={{ fontSize: "48px" }}></i>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  color="outline-primary"
                                  size="sm"
                                  onClick={() => logoInputRef.current?.click()}
                                  className="mt-2"
                                >
                                  <i className="ri-upload-2-line me-2"></i>
                                  Upload Logo
                                </Button>
                              </div>
                            </div>

                            <div>
                              <Label className="fw-semibold mb-3">Banner Image</Label>
                              <div
                                className="rounded-4 border bg-white d-flex align-items-center justify-content-center p-3"
                                style={{
                                  minHeight: "120px",
                                  background: bannerPreview
                                    ? `url(${bannerPreview}) center/contain no-repeat`
                                    : "none",
                                }}
                              >
                                {!bannerPreview && (
                                  <div className="text-center py-3">
                                    <i className="ri-image-line text-muted" style={{ fontSize: "32px" }}></i>
                                    <p className="text-muted small mb-0 mt-2">No banner image</p>
                                  </div>
                                )}
                              </div>
                              <Button
                                type="button"
                                color="outline-primary"
                                size="sm"
                                onClick={() => bannerInputRef.current?.click()}
                                className="mt-2 w-100"
                              >
                                <i className="ri-upload-2-line me-2"></i>
                                {bannerPreview ? "Change Banner" : "Upload Banner"}
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Tab 2: Operating Hours */}
                  <TabPane tabId="2">
                    <Row>
                      <Col lg={12}>
                        <Card className="border-0 shadow-none">
                          <CardHeader className="bg-transparent border-0 px-0 pt-0">
                            <h5 className="card-title mb-0">Operating Hours</h5>
                            <p className="text-muted small mb-0">
                              Set your business hours for each day of the week
                            </p>
                          </CardHeader>
                          <CardBody className="px-0">
                            <Row className="g-4">
                              {days.map((day) => (
                                <Col md={6} key={day.key}>
                                  <div className="border rounded-4 p-4 h-100 bg-white">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6 className="fw-semibold mb-0">{day.label}</h6>
                                      <Badge
                                        color={
                                          hoursValue?.[day.key]?.open && hoursValue?.[day.key]?.close
                                            ? "success"
                                            : "light"
                                        }
                                        pill
                                        className="px-3 py-2"
                                      >
                                        {hoursValue?.[day.key]?.open && hoursValue?.[day.key]?.close
                                          ? `${formatTimeDisplay(hoursValue[day.key].open)} - ${formatTimeDisplay(hoursValue[day.key].close)}`
                                          : "Closed"
                                        }
                                      </Badge>
                                    </div>
                                    <Row className="g-3">
                                      <Col xs={6}>
                                        <Input
                                          type="time"
                                          value={hoursValue?.[day.key]?.open || ""}
                                          onChange={(e) =>
                                            handleHoursChange(day.key, "open", e.target.value)
                                          }
                                          className="form-control-lg"
                                        />
                                      </Col>
                                      <Col xs={6}>
                                        <Input
                                          type="time"
                                          value={hoursValue?.[day.key]?.close || ""}
                                          onChange={(e) =>
                                            handleHoursChange(day.key, "close", e.target.value)
                                          }
                                          className="form-control-lg"
                                        />
                                      </Col>
                                    </Row>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>

            {/* Sticky Save Button */}
            <div className="sticky-bottom bg-white py-3 mt-4 border-top">
              <Container fluid>
                <Row className="align-items-center justify-content-between">
                  <Col lg={8}>
                    <div className="d-flex align-items-center gap-3">
                      <i className="ri-information-line text-muted"></i>
                      <small className="text-muted">
                        Changes will be visible to customers immediately after saving
                      </small>
                    </div>
                  </Col>
                  <Col lg={4} className="text-end">
                    <Button
                      color="primary"
                      type="submit"
                      size="lg"
                      className="px-5"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-3-line me-2"></i>
                          Save All Changes
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              </Container>
            </div>
          </Form>
        )}
      </Container>

      <style jsx>{`
        .nav-tabs-custom .nav-link {
          border: none;
          padding: 1rem 1.5rem;
          font-weight: 500;
          color: #6c757d;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        
        .nav-tabs-custom .nav-link.active {
          color: #338427;
          background: transparent;
          border-bottom: 3px solid #338427;
        }
        
        .nav-tabs-custom .nav-link:hover {
          color: #338427;
          background: rgba(10, 179, 156, 0.05);
        }
        
        .form-control-lg {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e9e9e9;
        }
        
        .form-control-lg:focus {
          border-color: #338427;
          box-shadow: 0 0 0 0.2rem rgba(10, 179, 156, 0.15);
        }
        
        .border-4 {
          border-width: 4px !important;
        }
        
        .sticky-bottom {
          position: sticky;
          bottom: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95) !important;
        }
      `}</style>
    </div>
  );
};

export default BusinessProfileSettings;
