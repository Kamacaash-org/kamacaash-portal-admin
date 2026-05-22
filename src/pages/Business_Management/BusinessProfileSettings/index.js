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
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getAdminBusinessProfile,
  getMyStaffProfile,
  updateAdminBusinessSettings,
} from "../../../helpers/backend_helper";

const days = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
  { key: 7, label: "Sunday" },
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
    socialLinks: {
      facebook: raw.social_links?.facebook || "",
      instagram: raw.social_links?.instagram || "",
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
            <Card className="border-0 shadow-sm overflow-hidden mb-4">
              <div
                className="position-relative"
                style={{
                  minHeight: "260px",
                  background: bannerPreview
                    ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${bannerPreview}) center/cover no-repeat`
                    : "linear-gradient(135deg, #22991a 0%, #40c637 55%, #b0f5aa 100%)",
                }}
              >
                <div className="position-absolute top-0 end-0 p-4">
                  <Button color="light" onClick={() => bannerInputRef.current?.click()}>
                    <i className="ri-image-edit-line me-1"></i>
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
              </div>
              <CardBody className="pt-0">
                <div className="d-flex flex-wrap align-items-end justify-content-between gap-4">
                  <div className="d-flex align-items-end gap-4">
                    <div >
                      <div
                        className="bg-white rounded-4 shadow p-2 d-flex align-items-center justify-content-center"
                        style={{ width: "128px", height: "128px" }}
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
                          <i className="ri-store-2-line fs-1 text-primary"></i>
                        )}
                      </div>
                    </div>
                    <div className="pb-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                        <h2 className="mb-0">{profile?.displayName || "Business Name"}</h2>
                        <Badge color="success" pill className="px-3 py-2">
                          Profile {profileCompletion}% complete
                        </Badge>
                      </div>
                      <div className="text-muted d-flex flex-wrap gap-3">
                        <span>
                          <i className="ri-mail-line me-1"></i>
                          {profile?.email || "-"}
                        </span>
                        <span>
                          <i className="ri-phone-line me-1"></i>
                          {profile?.phone || "-"}
                        </span>
                        <span>
                          <i className="ri-global-line me-1"></i>
                          {profile?.websiteUrl || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pb-2 d-flex gap-2 flex-wrap">
                    <Button color="light" onClick={() => logoInputRef.current?.click()}>
                      <i className="ri-upload-2-line me-1"></i>
                      Upload Logo
                    </Button>
                    <Button color="success" outline onClick={() => loadProfile(businessId)}>
                      <i className="ri-refresh-line me-1"></i>
                      Refresh
                    </Button>
                    <Input
                      innerRef={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="d-none"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Row className="g-4">
              <Col xl={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardBody className="p-4">
                    <h5 className="mb-1">Business Information</h5>
                    <p className="text-muted mb-4">
                      Update the public details customers see about your business.
                    </p>

                    <Row className="g-4">
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Display Name</Label>
                          <Input
                            value={profile?.displayName || ""}
                            onChange={(event) =>
                              handleFieldChange("displayName", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Legal Name</Label>
                          <Input value={profile?.legalName || ""} disabled />
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <FormGroup className="mb-0">
                          <Label>Description</Label>
                          <Input
                            type="textarea"
                            rows="5"
                            value={profile?.description || ""}
                            onChange={(event) =>
                              handleFieldChange("description", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <FormGroup className="mb-0">
                          <Label>Short Description</Label>
                          <Input
                            type="textarea"
                            rows="3"
                            value={profile?.shortDescription || ""}
                            onChange={(event) =>
                              handleFieldChange("shortDescription", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <CardBody className="p-4">
                    <h5 className="mb-1">Contact And Social Links</h5>
                    <p className="text-muted mb-4">
                      Keep your contact information and links up to date.
                    </p>

                    <Row className="g-4">
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={profile?.email || ""}
                            onChange={(event) =>
                              handleFieldChange("email", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Website URL</Label>
                          <Input
                            type="url"
                            value={profile?.websiteUrl || ""}
                            onChange={(event) =>
                              handleFieldChange("websiteUrl", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Phone</Label>
                          <Input
                            value={profile?.phone || ""}
                            onChange={(event) =>
                              handleFieldChange("phone", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Secondary Phone</Label>
                          <Input
                            value={profile?.secondaryPhone || ""}
                            onChange={(event) =>
                              handleFieldChange("secondaryPhone", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Facebook</Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.facebook || ""}
                            onChange={(event) =>
                              handleSocialChange("facebook", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-0">
                          <Label>Instagram</Label>
                          <Input
                            type="url"
                            value={profile?.socialLinks?.instagram || ""}
                            onChange={(event) =>
                              handleSocialChange("instagram", event.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardBody className="p-4">
                    <h5 className="mb-1">Operating Hours</h5>
                    <p className="text-muted mb-4">
                      Set the opening and closing times for each day.
                    </p>

                    <Row className="g-3">
                      {days.map((day) => (
                        <Col md={6} key={day.key}>
                          <div className="border rounded-3 p-3 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="fw-semibold">{day.label}</div>
                              <Badge color="light" className="text-dark">
                                {profile?.openHours?.[day.key]?.open &&
                                  profile?.openHours?.[day.key]?.close
                                  ? `${profile.openHours[day.key].open} - ${profile.openHours[day.key].close}`
                                  : "Closed"}
                              </Badge>
                            </div>
                            <Row className="g-2">
                              <Col xs={6}>
                                <Input
                                  type="time"
                                  value={profile?.openHours?.[day.key]?.open || ""}
                                  onChange={(event) =>
                                    handleHoursChange(
                                      day.key,
                                      "open",
                                      event.target.value,
                                    )
                                  }
                                />
                              </Col>
                              <Col xs={6}>
                                <Input
                                  type="time"
                                  value={profile?.openHours?.[day.key]?.close || ""}
                                  onChange={(event) =>
                                    handleHoursChange(
                                      day.key,
                                      "close",
                                      event.target.value,
                                    )
                                  }
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

              <Col xl={4}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardBody className="p-4">
                    <h5 className="mb-1">Media</h5>
                    <p className="text-muted mb-4">
                      Upload logo, banner, and gallery images.
                    </p>

                    <div className="mb-4">
                      <Label className="fw-semibold mb-2">Banner Preview</Label>
                      <div
                        className="rounded-3 border"
                        style={{
                          minHeight: "140px",
                          background: bannerPreview
                            ? `url(${bannerPreview}) center/cover no-repeat`
                            : "#f8f9fa",
                        }}
                      ></div>
                    </div>

                    <div className="mb-4">
                      <Label className="fw-semibold mb-2">Gallery Images</Label>
                      <div className="d-flex flex-wrap gap-2">
                        {(profile?.galleryImages || []).length ? (
                          profile.galleryImages.map((image, index) => (
                            <div
                              key={index}
                              className="rounded overflow-hidden border"
                              style={{ width: "70px", height: "70px" }}
                            >
                              <img
                                src={
                                  image instanceof File
                                    ? URL.createObjectURL(image)
                                    : image
                                }
                                alt={`Gallery ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          <small className="text-muted">
                            No gallery images uploaded yet.
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <Button color="light" onClick={() => galleryInputRef.current?.click()}>
                        <i className="ri-image-add-line me-1"></i>
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
                    </div>
                  </CardBody>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardBody className="p-4">
                    <h5 className="mb-1">Save Changes</h5>
                    <p className="text-muted mb-4">
                      Changes will be visible after the update succeeds.
                    </p>

                    <div className="d-grid">
                      <Button color="primary" type="submit" size="lg" disabled={saving}>
                        {saving ? "Saving..." : "Save All Changes"}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
      <ToastContainer />
    </div>
  );
};

export default BusinessProfileSettings;
