import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import { getStaffProfile } from "../../../helpers/backend_helper";

const StaffProfile = () => {
  document.title = "Staff Profile | Kamacash";

  const authUser = useAuthUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const staffId = authUser?.staffId;

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
    return date.toLocaleString();
  };

  const statusBadge = (value, trueLabel, falseLabel) => (
    <Badge color={value ? "success" : "danger"} pill>
      {value ? trueLabel : falseLabel}
    </Badge>
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Staff Profile" pageTitle="User Management" />

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner color="primary">Loading...</Spinner>
          </div>
        ) : error ? (
          <Card className="border-danger">
            <CardBody className="text-danger">{error}</CardBody>
          </Card>
        ) : (
          <Row>
            <Col xl={8}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Staff Information</h5>
                </CardHeader>
                <CardBody>
                  <Row className="gy-3">
                    <Col md={6}>
                      <div className="text-muted">Full Name</div>
                      <div className="fw-semibold">{fullName}</div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Username</div>
                      <div className="fw-semibold">
                        {profile?.username || "-"}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Email</div>
                      <div className="fw-semibold">{profile?.email || "-"}</div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Phone</div>
                      <div className="fw-semibold">
                        {profile?.countryCode || ""}
                        {profile?.phone ? ` ${profile.phone}` : "-"}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Role</div>
                      <Badge color="info" pill>
                        {profile?.role || "-"}
                      </Badge>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Sex</div>
                      <Badge
                        color={
                          profile?.sex === "MALE"
                            ? "primary"
                            : profile?.sex === "FEMALE"
                              ? "success"
                              : "secondary"
                        }
                        pill
                      >
                        {profile?.sex || "Not specified"}
                      </Badge>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Status</div>
                      {statusBadge(profile?.isActive, "Active", "Inactive")}
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Last Login</div>
                      <div className="fw-semibold">
                        {formatDate(profile?.lastLogin)}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Created At</div>
                      <div className="fw-semibold">
                        {formatDate(profile?.createdAt)}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted">Updated At</div>
                      <div className="fw-semibold">
                        {formatDate(profile?.updatedAt)}
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>

            <Col xl={4}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Security</h5>
                </CardHeader>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Two Factor</span>
                    {statusBadge(
                      profile?.twoFactorEnabled,
                      "Enabled",
                      "Disabled",
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Admin Approved</span>
                    {statusBadge(
                      profile?.isAdminApproved,
                      "Approved",
                      "Pending",
                    )}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default StaffProfile;
