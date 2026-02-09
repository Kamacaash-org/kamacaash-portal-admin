import React, { useEffect, useMemo, useState } from "react";
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
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getBusinessProfile,
  getStaffProfile,
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
  const [resolvedBusinessId, setResolvedBusinessId] = useState(
    businessId || "",
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

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
    if (logoFile) {
      const previewUrl = URL.createObjectURL(logoFile);
      setLogoPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
    return undefined;
  }, [logoFile]);

  useEffect(() => {
    if (bannerFile) {
      const previewUrl = URL.createObjectURL(bannerFile);
      setBannerPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
    return undefined;
  }, [bannerFile]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("Update API not provided yet. Form edits are not saved.");
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb
          title="Business Profile Settings"
          pageTitle="Business Management"
        />

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner color="primary">Loading...</Spinner>
          </div>
        ) : error ? (
          <Card className="border-danger">
            <CardBody className="text-danger">{error}</CardBody>
          </Card>
        ) : (
          <Form onSubmit={handleSubmit}>
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
                      <Col md={6}>
                        <FormGroup>
                          <Label for="city">City</Label>
                          <Input
                            id="city"
                            type="text"
                            value={profile?.address?.city || ""}
                            onChange={(e) =>
                              handleAddressChange("city", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="state">State</Label>
                          <Input
                            id="state"
                            type="text"
                            value={profile?.address?.state || ""}
                            onChange={(e) =>
                              handleAddressChange("state", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="country">Country</Label>
                          <Input
                            id="country"
                            type="text"
                            value={profile?.address?.country || ""}
                            onChange={(e) =>
                              handleAddressChange("country", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="postcode">Postcode</Label>
                          <Input
                            id="postcode"
                            type="text"
                            value={profile?.address?.postcode || ""}
                            onChange={(e) =>
                              handleAddressChange("postcode", e.target.value)
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
                      <div className="mb-3">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Business Logo"
                            className="img-thumbnail w-100"
                            style={{ maxHeight: "180px", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="avatar-lg mx-auto">
                            <div className="avatar-title bg-light text-primary rounded-circle">
                              <i className="ri-store-2-line fs-24"></i>
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setLogoFile(e.target.files?.[0] || null)
                        }
                      />
                    </FormGroup>

                    <FormGroup className="mt-4">
                      <Label className="form-label">Banner Image</Label>
                      <div className="mb-3">
                        {bannerPreview ? (
                          <img
                            src={bannerPreview}
                            alt="Business Banner"
                            className="img-thumbnail w-100"
                            style={{ maxHeight: "180px", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="avatar-lg mx-auto">
                            <div className="avatar-title bg-light text-primary rounded-circle">
                              <i className="ri-image-line fs-24"></i>
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setBannerFile(e.target.files?.[0] || null)
                        }
                      />
                    </FormGroup>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Alert color="warning" className="mb-3">
                      Update API not provided yet. Changes are not saved.
                    </Alert>
                    <Button
                      color="success"
                      type="submit"
                      className="w-100"
                      disabled
                    >
                      Save Changes
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
