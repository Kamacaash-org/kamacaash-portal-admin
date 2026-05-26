import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Progress,
  Modal,
  ModalBody,
  ModalHeader,
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
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getAdminBusinessProfile,
  getMyStaffProfile,
  updateAdminBusinessSettings,
} from "../../../helpers/backend_helper";

const days = [
  { key: 1, label: "Monday", short: "MON" },
  { key: 2, label: "Tuesday", short: "TUE" },
  { key: 3, label: "Wednesday", short: "WED" },
  { key: 4, label: "Thursday", short: "THU" },
  { key: 5, label: "Friday", short: "FRI" },
  { key: 6, label: "Saturday", short: "SAT" },
  { key: 7, label: "Sunday", short: "SUN" },
];

const emptyHours = () =>
  days.reduce((acc, day) => {
    acc[day.key] = { open: "", close: "" };
    return acc;
  }, {});

const normalizeOpenHours = (value) => {
  const normalized = emptyHours();

  if (!Array.isArray(value)) return normalized;

  value.forEach((entry) => {
    const dayOfWeek = Number(entry?.day_of_week);
    const key = days.some((day) => day.key === dayOfWeek) ? dayOfWeek : null;
    if (!key) return;

    normalized[key] = {
      open: entry?.opens_at || "",
      close: entry?.closes_at || "",
    };
  });

  return normalized;
};

const serializeOpenHours = (hoursMap) =>
  days
    .map((day) => ({
      day_of_week: day.key,
      opens_at: hoursMap?.[day.key]?.open || "",
      closes_at: hoursMap?.[day.key]?.close || "",
    }))
    .filter((entry) => entry.opens_at || entry.closes_at);

const normalizeBusinessProfile = (raw) => {
  if (!raw) return null;

  return {
    id: raw.id || "",
    displayName: raw.display_name || "",
    legalName: raw.legal_name || "",
    logoUrl: raw.logo_url || "",
    bannerUrl: raw.banner_url || "",
    galleryImages: raw.gallery_images || [],
    description: raw.description || "",
    shortDescription: raw.short_description || "",
    email: raw.email || "",
    phone: raw.phone || "",
    secondaryPhone: raw.secondary_phone || "",
    websiteUrl: raw.website_url || "",
    addressLine: raw.address_line || "",
    cityId: raw.city_id || "",
    state: raw.state || "",
    zipCode: raw.zip_code || "",
    country: raw.country || "",
    taxId: raw.tax_id || "",
    businessType: raw.business_type || "",
    establishedYear: raw.established_year || "",
    defaultGracePeriod: raw.default_grace_period !== undefined && raw.default_grace_period !== null ? raw.default_grace_period : 30,
    defaultOrderCutoff: raw.default_order_cutoff !== undefined && raw.default_order_cutoff !== null ? raw.default_order_cutoff : 45,
    socialLinks: {
      facebook: raw.social_links?.facebook || "",
      instagram: raw.social_links?.instagram || "",
      twitter: raw.social_links?.twitter || "",
      linkedin: raw.social_links?.linkedin || "",
      youtube: raw.social_links?.youtube || "",
    },
    openHours: normalizeOpenHours(raw.open_hours || []),
    logoFile: null,
    bannerFile: null,
    galleryFiles: [],
  };
};

const BusinessProfileSettings = () => {
  document.title = "Business Profile Settings | Kamacaash";

  const authUser = useAuthUser();
  const [businessId, setBusinessId] = useState(authUser?.businessId || "");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");



  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const resolveBusinessId = async () => {
    if (authUser?.businessId) return authUser.businessId;

    const response = await getMyStaffProfile();
    return response?.data?.business?.id || "";
  };

  const loadProfile = async (resolvedId) => {
    setLoading(true);
    setError("");

    try {
      const finalBusinessId = resolvedId || (await resolveBusinessId());
      if (!finalBusinessId) {
        throw new Error("Business ID not found. Please sign in again.");
      }

      setBusinessId(finalBusinessId);

      const response = await getAdminBusinessProfile(finalBusinessId);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to load business profile");
      }

      setProfile(normalizeBusinessProfile(response.data));
    } catch (err) {
      setError(err?.message || "Failed to load business profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile(authUser?.businessId || "");
  }, [authUser?.businessId]);

  const profileCompletion = useMemo(() => {
    const fields = [
      profile?.displayName,
      profile?.description,
      profile?.shortDescription,
      profile?.email,
      profile?.phone,
      profile?.websiteUrl,
      profile?.address,
      profile?.city,
      profile?.logoFile || profile?.logoUrl,
      profile?.bannerFile || profile?.bannerUrl,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [profile]);

  const logoPreview = useMemo(() => {
    if (!profile) return "";
    if (profile.logoFile instanceof File) {
      return URL.createObjectURL(profile.logoFile);
    }
    return profile.logoUrl || "";
  }, [profile]);

  const bannerPreview = useMemo(() => {
    if (!profile) return "";
    if (profile.bannerFile instanceof File) {
      return URL.createObjectURL(profile.bannerFile);
    }
    return profile.bannerUrl || "";
  }, [profile]);

  useEffect(() => {
    return () => {
      if (logoPreview && profile?.logoFile instanceof File) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview && profile?.bannerFile instanceof File) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview, logoPreview, profile]);

  const handleFieldChange = (key, value) => {
    setProfile((prev) => ({
      ...(prev || {}),
      [key]: value,
    }));
  };

  const handleSocialChange = (key, value) => {
    setProfile((prev) => ({
      ...(prev || {}),
      socialLinks: {
        ...(prev?.socialLinks || {}),
        [key]: value,
      },
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setProfile((prev) => ({
      ...(prev || {}),
      openHours: {
        ...(prev?.openHours || {}),
        [day]: {
          ...(prev?.openHours?.[day] || { open: "", close: "" }),
          [field]: value,
        },
      },
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFieldChange("logoFile", file);
  };

  const handleBannerChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFieldChange("bannerFile", file);
  };

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setProfile((prev) => ({
      ...(prev || {}),
      galleryFiles: files,
      galleryImages: [
        ...(prev?.galleryImages || []).filter((item) => typeof item === "string"),
        ...files,
      ],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!businessId || !profile) return;

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("display_name", profile.displayName || "");
      formData.append("description", profile.description || "");
      formData.append("short_description", profile.shortDescription || "");
      formData.append("email", profile.email || "");
      formData.append("phone", profile.phone || "");
      formData.append("secondary_phone", profile.secondaryPhone || "");
      formData.append("website_url", profile.websiteUrl || "");
      formData.append("default_grace_period", profile.defaultGracePeriod !== undefined && profile.defaultGracePeriod !== null ? profile.defaultGracePeriod : 30);
      formData.append("default_order_cutoff", profile.defaultOrderCutoff !== undefined && profile.defaultOrderCutoff !== null ? profile.defaultOrderCutoff : 45);
      formData.append("social_links", JSON.stringify(profile.socialLinks || {}));
      formData.append(
        "open_hours",
        JSON.stringify(serializeOpenHours(profile.openHours || {})),
      );

      if (profile.logoFile instanceof File) {
        formData.append("logo_url", profile.logoFile);
      }
      if (profile.bannerFile instanceof File) {
        formData.append("banner_url", profile.bannerFile);
      }
      (profile.galleryFiles || []).forEach((file) => {
        if (file instanceof File) {
          formData.append("gallery_images", file);
        }
      });

      const response = await updateAdminBusinessSettings(businessId, formData);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to update business settings");
      }

      toast.success("Business settings updated successfully");
      await loadProfile(businessId);
    } catch (err) {
      const message = err?.message || "Failed to update business settings";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const StatCard = ({ icon, color, title, value }) => (
    <div className="text-center p-3 border rounded-3 bg-white">
      <div className={`avatar-sm bg-${color}-subtle rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center`}>
        <i className={`ri-${icon} text-${color} fs-4`}></i>
      </div>
      <div className="fs-2 fw-bold">{value}</div>
      <div className="small text-muted">{title}</div>
    </div>
  );

  const TabHeader = ({ id, icon, label, badge }) => (
    <NavLink
      className={classnames({ active: activeTab === id })}
      onClick={() => setActiveTab(id)}
      style={{ cursor: "pointer" }}
    >
      <i className={`ri-${icon} me-2`}></i>
      {label}
      {badge && (
        <Badge color="primary" className="ms-2" pill>
          {badge}
        </Badge>
      )}
    </NavLink>
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Business Profile Settings" pageTitle="Business" />

        {loading ? (
          <Loader />
        ) : error ? (
          <Alert color="danger" className="mb-0">
            <i className="ri-error-warning-line me-2"></i>
            {error}
          </Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            {/* Hero Banner Section */}
            <div className="position-relative rounded-4 overflow-hidden mb-5 shadow-sm">
              <div
                className="position-relative"
                style={{
                  minHeight: "320px",
                  background: bannerPreview
                    ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${bannerPreview}) center/cover no-repeat`
                    : "linear-gradient(135deg, #40c637 0%, #76e16a 50%, #b0f5aa 100%)",
                }}
              >
                <div className="position-absolute top-0 end-0 p-4">
                  <Button
                    color="light"
                    onClick={() => bannerInputRef.current?.click()}
                    className="shadow-sm"
                  >
                    <i className="ri-camera-line me-2"></i>
                    Change Banner
                  </Button>
                  <Input
                    innerRef={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="d-none"
                  />
                </div>

                {/* Business Info Overlay */}
                <div className="position-absolute bottom-0 start-0 w-100 p-4">
                  <div className="d-flex align-items-end gap-4 flex-wrap">
                    <div className="position-relative">
                      <div
                        className="bg-white rounded-4 shadow-lg p-2"
                        style={{ width: "140px", height: "140px", cursor: "pointer" }}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Business logo"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <i className="ri-store-3-line text-primary fs-1"></i>
                          </div>
                        )}
                      </div>
                      <div className="text-muted font-size-10 mt-1 text-center" style={{ maxWidth: "140px" }}>
                        Logo: 500x500px (1:1)
                      </div>
                      <Button
                        color="light"
                        size="sm"
                        className="position-absolute bottom-0 end-0 rounded-circle p-1"
                        style={{ width: "32px", height: "32px" }}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <i className="ri-pencil-line"></i>
                      </Button>
                      <Input
                        innerRef={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="d-none"
                      />
                    </div>

                    <div>
                      <h1 className="display-6 fw-bold mb-2 text-white">{profile?.displayName || "Business Name"}</h1>
                      <div className="d-flex gap-3 flex-wrap">
                        <Badge color="primary" className="px-3 py-2">
                          <i className="ri-mail-line me-1"></i>
                          {profile?.email || "No email"}
                        </Badge>
                        <Badge color="info" className="px-3 py-2">
                          <i className="ri-phone-line me-1"></i>
                          {profile?.phone || "No phone"}
                        </Badge>
                        {profile?.websiteUrl && (
                          <Badge color="warning" className="px-3 py-2">
                            <i className="ri-global-line me-1"></i>
                            {profile.websiteUrl.replace(/^https?:\/\//, '')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <Row className="g-4 mb-4">
              <Col lg={3} md={6}>
                <StatCard icon="star-line" color="warning" title="Profile Completion" value={`${profileCompletion}%`} />
              </Col>
              <Col lg={3} md={6}>
                <StatCard icon="image-line" color="primary" title="Gallery Images" value={profile?.galleryImages?.length || 0} />
              </Col>
              <Col lg={3} md={6}>
                <StatCard icon="time-line" color="success" title="Operating Days" value={Object.values(profile?.openHours || {}).filter(h => h.open && h.close).length} />
              </Col>
              <Col lg={3} md={6}>
                <StatCard icon="link" color="info" title="Social Links" value={Object.values(profile?.socialLinks || {}).filter(l => l).length} />
              </Col>
            </Row>

            {/* Navigation Tabs */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <CardBody className="p-0">
                <Nav tabs className="nav-tabs-custom p-3 pb-0">
                  <NavItem>
                    <TabHeader id="basic" icon="store-line" label="Basic Information" />
                  </NavItem>
                  <NavItem>
                    <TabHeader id="contact" icon="mail-line" label="Contact & Location" />
                  </NavItem>
                  <NavItem>
                    <TabHeader id="hours" icon="time-line" label="Business Hours"
                      badge={Object.values(profile?.openHours || {}).filter(h => h.open && h.close).length} />
                  </NavItem>
                  <NavItem>
                    <TabHeader id="social" icon="share-line" label="Social Media" />
                  </NavItem>
                  <NavItem>
                    <TabHeader id="media" icon="image-line" label="Media Gallery"
                      badge={profile?.galleryImages?.length} />
                  </NavItem>
                  <NavItem>
                    <TabHeader id="advanced" icon="settings-3-line" label="Advanced" />
                  </NavItem>
                </Nav>

                <TabContent activeTab={activeTab} className="p-4">
                  {/* Basic Information Tab */}
                  <TabPane tabId="basic">
                    <Row className="g-4">
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Display Name *</Label>
                          <Input
                            value={profile?.displayName || ""}
                            onChange={(event) => handleFieldChange("displayName", event.target.value)}
                            placeholder="Your business name"
                            className="py-2"
                          />
                          <small className="text-muted">This is how customers will see your business</small>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Legal Name</Label>
                          <Input value={profile?.legalName || ""} disabled className="bg-light" />
                          <small className="text-muted">Legal name cannot be changed</small>
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <FormGroup>
                          <Label className="fw-semibold">Business Description</Label>
                          <Input
                            type="textarea"
                            rows="5"
                            value={profile?.description || ""}
                            onChange={(event) => handleFieldChange("description", event.target.value)}
                            placeholder="Tell customers about your business..."
                            className="py-2"
                          />
                          <small className="text-muted">Detailed description of your business (max 500 words)</small>
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <FormGroup>
                          <Label className="fw-semibold">Short Description</Label>
                          <Input
                            type="textarea"
                            rows="3"
                            value={profile?.shortDescription || ""}
                            onChange={(event) => handleFieldChange("shortDescription", event.target.value)}
                            placeholder="Brief summary of your business"
                            className="py-2"
                          />
                          <small className="text-muted">This appears in search results and listings (max 160 characters)</small>
                        </FormGroup>
                      </Col>

                    </Row>
                  </TabPane>

                  {/* Contact & Location Tab */}
                  <TabPane tabId="contact">
                    <Row className="g-4">
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Email Address</Label>
                          <Input
                            type="email"
                            value={profile?.email || ""}
                            onChange={(event) => handleFieldChange("email", event.target.value)}
                            placeholder="contact@yourbusiness.com"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Phone Number</Label>
                          <Input
                            value={profile?.phone || ""}
                            onChange={(event) => handleFieldChange("phone", event.target.value)}
                            placeholder="+1 234 567 8900"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Secondary Phone</Label>
                          <Input
                            value={profile?.secondaryPhone || ""}
                            onChange={(event) => handleFieldChange("secondaryPhone", event.target.value)}
                            placeholder="Alternative contact number"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Website URL</Label>
                          <Input
                            type="url"
                            value={profile?.websiteUrl || ""}
                            onChange={(event) => handleFieldChange("websiteUrl", event.target.value)}
                            placeholder="https://yourbusiness.com"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>

                    </Row>
                  </TabPane>

                  {/* Business Hours Tab */}
                  <TabPane tabId="hours">
                    <div className="row g-3">
                      {days.map((day) => (
                        <div className="col-md-6" key={day.key}>
                          <div className="p-3 bg-light rounded-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="fw-semibold">{day.label}</div>
                              <Badge color={profile?.openHours?.[day.key]?.open && profile?.openHours?.[day.key]?.close ? "success" : "secondary"}>
                                {profile?.openHours?.[day.key]?.open && profile?.openHours?.[day.key]?.close ? "Open" : "Closed"}
                              </Badge>
                            </div>
                            <div className="row g-2">
                              <div className="col-6">
                                <Label className="small text-muted">Opening Time</Label>
                                <Input
                                  type="time"
                                  value={profile?.openHours?.[day.key]?.open || ""}
                                  onChange={(event) => handleHoursChange(day.key, "open", event.target.value)}
                                  className="bg-white"
                                />
                              </div>
                              <div className="col-6">
                                <Label className="small text-muted">Closing Time</Label>
                                <Input
                                  type="time"
                                  value={profile?.openHours?.[day.key]?.close || ""}
                                  onChange={(event) => handleHoursChange(day.key, "close", event.target.value)}
                                  className="bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-info bg-opacity-10 rounded-3">
                      <i className="ri-information-line me-2"></i>
                      <small>Leave both fields empty to mark the day as closed</small>
                    </div>
                  </TabPane>

                  {/* Social Media Tab */}
                  <TabPane tabId="social">
                    <Row className="g-4">
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">
                            <i className="ri-facebook-circle-line text-primary me-2"></i> Facebook
                          </Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.facebook || ""}
                            onChange={(event) => handleSocialChange("facebook", event.target.value)}
                            placeholder="https://facebook.com/yourbusiness"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">
                            <i className="ri-instagram-line text-danger me-2"></i> Instagram
                          </Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.instagram || ""}
                            onChange={(event) => handleSocialChange("instagram", event.target.value)}
                            placeholder="https://instagram.com/yourbusiness"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">
                            <i className="ri-twitter-x-line text-dark me-2"></i> Twitter/X
                          </Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.twitter || ""}
                            onChange={(event) => handleSocialChange("twitter", event.target.value)}
                            placeholder="https://twitter.com/yourbusiness"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">
                            <i className="ri-linkedin-box-line text-info me-2"></i> LinkedIn
                          </Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.linkedin || ""}
                            onChange={(event) => handleSocialChange("linkedin", event.target.value)}
                            placeholder="https://linkedin.com/company/yourbusiness"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <FormGroup>
                          <Label className="fw-semibold">
                            <i className="ri-youtube-line text-danger me-2"></i> YouTube
                          </Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.youtube || ""}
                            onChange={(event) => handleSocialChange("youtube", event.target.value)}
                            placeholder="https://youtube.com/c/yourbusiness"
                            className="py-2"
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Media Gallery Tab */}
                  <TabPane tabId="media">
                    <div className="mb-4">
                      <Label className="fw-semibold mb-1">Banner Image</Label>
                      <div className="text-muted font-size-11 mb-2">Recommended Store Banner: 1200x400px (3:1 Aspect Ratio)</div>
                      <div
                        className="rounded-3 overflow-hidden border cursor-pointer"
                        style={{ height: "200px", cursor: "pointer", background: "#f8f9fa" }}
                        onClick={() => bannerPreview && setPreviewImage(bannerPreview)}
                      >
                        {bannerPreview ? (
                          <img
                            src={bannerPreview}
                            alt="Banner"
                            style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#f8f9fa" }}
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="text-center">
                              <i className="ri-image-line fs-1 text-muted"></i>
                              <div className="small text-muted mt-2">No banner image set</div>
                              <Button color="primary" size="sm" className="mt-2" onClick={() => bannerInputRef.current?.click()}>
                                Upload Banner
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="fw-semibold mb-1">Gallery Images</Label>
                      <div className="text-muted font-size-11 mb-2">Recommended size: 800x600px (4:3 Aspect Ratio)</div>
                      <div className="d-flex flex-wrap gap-3">
                        {(profile?.galleryImages || []).length > 0 ? (
                          profile.galleryImages.map((image, index) => {
                            const src = image instanceof File ? URL.createObjectURL(image) : image;
                            return (
                              <div
                                key={index}
                                className="rounded overflow-hidden border position-relative"
                                style={{ width: "120px", height: "120px", cursor: "pointer" }}
                                onClick={() => setPreviewImage(src)}
                              >
                                <img
                                  src={src}
                                  alt={`Gallery ${index + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#f8f9fa" }}
                                />
                                <div className="position-absolute top-0 end-0 p-1">
                                  <Badge color="dark" className="rounded-circle">
                                    {index + 1}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center w-100 py-5 bg-light rounded-3">
                            <i className="ri-image-line fs-1 text-muted"></i>
                            <div className="text-muted mt-2">No gallery images uploaded yet</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <Button color="primary" onClick={() => galleryInputRef.current?.click()}>
                        <i className="ri-upload-2-line me-2"></i>
                        Upload Gallery Images
                      </Button>
                      <Input
                        innerRef={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                        className="d-none"
                      />
                      <small className="text-muted text-center">Supported formats: JPG, PNG, GIF. Max size: 5MB per image</small>
                    </div>
                  </TabPane>

                  {/* Advanced Tab */}
                  <TabPane tabId="advanced">
                    <Row className="g-4">

                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Default Grace Period (minutes)</Label>
                          <Input
                            type="number"
                            value={profile?.defaultGracePeriod !== undefined ? profile.defaultGracePeriod : ""}
                            onChange={(event) => handleFieldChange("defaultGracePeriod", Number(event.target.value))}
                            placeholder="e.g. 30"
                            className="py-2"
                          />
                          <small className="text-muted">Additional minutes customers have for late collections before a No-Show trigger</small>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="fw-semibold">Default Order Cut-off (minutes)</Label>
                          <Input
                            type="number"
                            value={profile?.defaultOrderCutoff !== undefined ? profile.defaultOrderCutoff : ""}
                            onChange={(event) => handleFieldChange("defaultOrderCutoff", Number(event.target.value))}
                            placeholder="e.g. 45"
                            className="py-2"
                          />
                          <small className="text-muted">Minutes before the pickup window ends to stop accepting new orders</small>
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <div className="alert alert-info">
                          <i className="ri-information-line me-2"></i>
                          <strong>Note:</strong> Editing default grace periods and order cut-offs updates the default behavior for all new offers.
                        </div>
                      </Col>
                    </Row>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>

            {/* Action Buttons */}
            <Card className="border-0 shadow-sm rounded-4">
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h5 className="mb-1">Ready to publish?</h5>
                    <small className="text-muted">Review your changes before saving</small>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      color="light"
                      onClick={() => loadProfile(businessId)}
                      disabled={saving}
                    >
                      <i className="ri-refresh-line me-2"></i>
                      Reset Changes
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      size="lg"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <i className="ri-loader-4-line spin me-2"></i>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line me-2"></i>
                          Save All Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Progress
                  value={profileCompletion}
                  color="success"
                  className="rounded-pill mt-4"
                  style={{ height: "6px" }}
                />
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">Profile completion</small>
                  <small className="fw-semibold text-primary">{profileCompletion}%</small>
                </div>
              </CardBody>
            </Card>
          </Form>
        )}
      </Container>

      {/* Image Preview Modal */}
      <Modal isOpen={isPreviewOpen} toggle={() => setIsPreviewOpen(false)} centered size="lg">
        <ModalHeader toggle={() => setIsPreviewOpen(false)}>Image Preview</ModalHeader>
        <ModalBody className="p-0">
          <img src={previewImage} alt="Preview" style={{ width: "100%", height: "auto" }} />
        </ModalBody>
      </Modal>

      <ToastContainer />


    </div>
  );
};

export default BusinessProfileSettings;