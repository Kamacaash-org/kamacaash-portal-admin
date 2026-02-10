import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
  Spinner,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getBusinessProfile,
  getStaffProfile,
  updateBusinessProfile,
} from "../../../helpers/backend_helper";

// Import FilePond for file uploads

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
  const [resolvedBusinessId, setResolvedBusinessId] = useState(
    businessId || "",
  );

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
      if (!resolvedBusinessId) {
        return;
      }

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
        if (isMounted) {
          setLoading(false);
        }
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
      const response = await updateBusinessProfile(
        resolvedBusinessId,
        submitData,
      );
      if (response?.success) {
        toast.success("Business profile updated successfully");
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

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb
          title="Business Profile Settings"
          pageTitle="Business Management"
        />
        <ToastContainer position="top-right" />

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner color="primary">Loading...</Spinner>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error ? <Alert color="danger">{error}</Alert> : null}
            <Row className="g-4">
              <Col xl={8}>
                <Card>
                  <CardHeader>
                    <h5 className="card-title mb-0">Business Information</h5>
                  </CardHeader>
                  <CardBody>
                    <Row className="g-3">
                      <Col md={6}>
                        <FormGroup>
                          <Label for="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            type="text"
                            value={profile?.businessName || ""}
                            onChange={(e) =>
                              handleFieldChange("businessName", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile?.email || ""}
                            onChange={(e) =>
                              handleFieldChange("email", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="phoneNumber">Phone</Label>
                          <Input
                            id="phoneNumber"
                            type="text"
                            value={profile?.phoneNumber || ""}
                            onChange={(e) =>
                              handleFieldChange("phoneNumber", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="description">Description</Label>
                          <Input
                            id="description"
                            type="text"
                            value={profile?.description || ""}
                            onChange={(e) =>
                              handleFieldChange("description", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h5 className="card-title mb-0">Address</h5>
                  </CardHeader>
                  <CardBody>
                    <Row className="g-3">
                      <Col md={6}>
                        <FormGroup>
                          <Label for="street">Street</Label>
                          <Input
                            id="street"
                            type="text"
                            value={profile?.address?.street || ""}
                            onChange={(e) =>
                              handleAddressChange("street", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h5 className="card-title mb-0">Opening Hours</h5>
                  </CardHeader>
                  <CardBody>
                    <Row className="g-3">
                      {days.map((day) => (
                        <React.Fragment key={day.key}>
                          <Col md={4}>
                            <Label className="text-muted">{day.label}</Label>
                          </Col>
                          <Col md={4}>
                            <Input
                              type="time"
                              value={hoursValue?.[day.key]?.open || ""}
                              onChange={(e) =>
                                handleHoursChange(
                                  day.key,
                                  "open",
                                  e.target.value,
                                )
                              }
                            />
                          </Col>
                          <Col md={4}>
                            <Input
                              type="time"
                              value={hoursValue?.[day.key]?.close || ""}
                              onChange={(e) =>
                                handleHoursChange(
                                  day.key,
                                  "close",
                                  e.target.value,
                                )
                              }
                            />
                          </Col>
                        </React.Fragment>
                      ))}
                    </Row>
                  </CardBody>
                </Card>
              </Col>

              <Col xl={4}>
                <Card>
                  <CardHeader>
                    <h5 className="card-title mb-0">Media</h5>
                  </CardHeader>
                  <CardBody>
                    <FormGroup>
                      <Label className="form-label">Logo</Label>
                      <div className="position-relative mb-3 media-preview">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Business Logo"
                            className="img-thumbnail w-100 media-preview-image"
                            style={{ maxHeight: "180px", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="avatar-lg mx-auto">
                            <div className="avatar-title bg-light text-primary rounded-circle">
                              <i className="ri-store-2-line fs-24"></i>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-light btn-sm position-absolute top-0 end-0 m-2 media-edit-btn"
                          onClick={() => logoInputRef.current?.click()}
                          aria-label="Change logo"
                        >
                          <i className="ri-image-edit-line"></i>
                        </button>
                        <Input
                          innerRef={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="d-none"
                        />
                      </div>
                    </FormGroup>

                    <FormGroup className="mt-4">
                      <Label className="form-label">Banner Image</Label>
                      <div className="position-relative mb-3 media-preview">
                        {bannerPreview ? (
                          <img
                            src={bannerPreview}
                            alt="Business Banner"
                            className="img-thumbnail w-100 media-preview-image"
                            style={{ maxHeight: "180px", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="avatar-lg mx-auto">
                            <div className="avatar-title bg-light text-primary rounded-circle">
                              <i className="ri-image-line fs-24"></i>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-light btn-sm position-absolute top-0 end-0 m-2 media-edit-btn"
                          onClick={() => bannerInputRef.current?.click()}
                          aria-label="Change banner"
                        >
                          <i className="ri-image-edit-line"></i>
                        </button>
                        <Input
                          innerRef={bannerInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileChange}
                          className="d-none"
                        />
                      </div>
                    </FormGroup>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Button
                      color="success"
                      type="submit"
                      className="w-100"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
    </div>
  );
};

export default BusinessProfileSettings;
