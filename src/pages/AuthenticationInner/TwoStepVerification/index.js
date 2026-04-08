import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Container, Row, Spinner } from "reactstrap";

//import images
import AuthSlider from "../authCarousel";
import { useNavigate } from "react-router-dom";
import { setAuthorization } from "../../../helpers/api_helper";
import { verify2FA } from "../../../helpers/backend_helper";

const TwosVerify = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const staffId = useMemo(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem("authUser"));
      return stored?.data?.staffId || null;
    } catch (e) {
      return null;
    }
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!staffId) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await verify2FA({
        staffId,
        otp: "123456",
      });

      if (!response?.success) {
        setError(response?.message || "Failed to verify OTP");
        return;
      }

      const responseData = response?.data || {};
      const tokenBag = responseData?.tokens || {};
      const user = responseData?.user || {};
      const normalizedStaff = responseData?.staff || {
        staffId: user?._id || user?.id || staffId,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        role: user?.role,
        businessId: user?.businessId,
        businessName: user?.businessName,
        must_change_password: user?.must_change_password,
      };

      const resolvedStaffId =
        responseData?.staffId ||
        responseData?.staff?.staffId ||
        responseData?.staff?._id ||
        responseData?.staff?.id ||
        user?.staffId ||
        user?._id ||
        user?.id ||
        staffId;

      const accessToken =
        responseData?.accessToken ||
        responseData?.access_token ||
        tokenBag?.accessToken ||
        tokenBag?.access_token ||
        tokenBag?.token ||
        null;
      const refreshToken =
        responseData?.refreshToken ||
        responseData?.refresh_token ||
        tokenBag?.refreshToken ||
        tokenBag?.refresh_token ||
        null;

      const normalizedAuthResponse = {
        ...response,
        data: {
          ...responseData,
          accessToken: accessToken || responseData?.accessToken,
          access_token: accessToken || responseData?.access_token,
          refreshToken: refreshToken || responseData?.refreshToken,
          refresh_token: refreshToken || responseData?.refresh_token,
          requires2fa: false,
          staffId: resolvedStaffId,
          staff: normalizedStaff,
        },
      };

      if (accessToken) {
        setAuthorization(accessToken);
      }

      sessionStorage.setItem(
        "authUser",
        JSON.stringify(normalizedAuthResponse),
      );

      if (normalizedStaff?.must_change_password) {
        navigate("/auth-change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (verifyError) {
      setError(verifyError?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const getInputElement = (index) => {
    return document.getElementById("digit" + index + "-input");
  };

  const moveToNext = (index) => {
    if (getInputElement(index).value.length === 1) {
      if (index !== 4) {
        getInputElement(index + 1).focus();
      } else {
        getInputElement(index).blur();
        handleVerify({
          preventDefault: () => {},
        });
      }
    }
  };

  return (
    <React.Fragment>
      <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
        <div className="bg-overlay"></div>
        <div className="auth-page-content overflow-hidden pt-lg-5">
          <Container>
            <Row>
              <Col lg={12}>
                <Card className="overflow-hidden card-bg-fill galaxy-border-none">
                  <Row className="justify-content-center g-0">
                    <AuthSlider />
                    <Col lg={6}>
                      <div className="p-lg-5 p-4">
                        <div className="mb-4">
                          <div className="avatar-lg mx-auto">
                            <div className="avatar-title bg-light text-primary display-5 rounded-circle">
                              <i className="ri-mail-line"></i>
                            </div>
                          </div>
                        </div>
                        <div className="text-muted text-center mx-lg-3">
                          <h4 className="">Verify Your Email</h4>
                          <p>Please confirm OTP verification to continue.</p>
                        </div>

                        <div className="mt-4">
                          {error ? <Alert color="danger">{error}</Alert> : null}
                          <form onSubmit={handleVerify}>
                            <Row>
                              <Col className="col-3">
                                <div className="mb-3">
                                  <label
                                    htmlFor="digit1-input"
                                    className="visually-hidden"
                                  >
                                    Digit 1
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-light text-center"
                                    maxLength="1"
                                    id="digit1-input"
                                    onKeyUp={() => moveToNext(1)}
                                  />
                                </div>
                              </Col>

                              <Col className="col-3">
                                <div className="mb-3">
                                  <label
                                    htmlFor="digit2-input"
                                    className="visually-hidden"
                                  >
                                    Digit 2
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-light text-center"
                                    maxLength="1"
                                    id="digit2-input"
                                    onKeyUp={() => moveToNext(2)}
                                  />
                                </div>
                              </Col>

                              <Col className="col-3">
                                <div className="mb-3">
                                  <label
                                    htmlFor="digit3-input"
                                    className="visually-hidden"
                                  >
                                    Digit 3
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-light text-center"
                                    maxLength="1"
                                    id="digit3-input"
                                    onKeyUp={() => moveToNext(3)}
                                  />
                                </div>
                              </Col>

                              <Col className="col-3">
                                <div className="mb-3">
                                  <label
                                    htmlFor="digit4-input"
                                    className="visually-hidden"
                                  >
                                    Digit 4
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-light text-center"
                                    maxLength="1"
                                    id="digit4-input"
                                    onKeyUp={() => moveToNext(4)}
                                  />
                                </div>
                              </Col>
                            </Row>

                            <div className="mt-3">
                              <Button
                                color="success"
                                className="w-100"
                                type="submit"
                                disabled={loading}
                              >
                                {loading ? (
                                  <Spinner size="sm" className="me-2">
                                    {" "}
                                    Loading...{" "}
                                  </Spinner>
                                ) : null}
                                Confirm
                              </Button>
                            </div>
                          </form>
                        </div>

                        <div className="mt-5 text-center">
                          <p className="mb-0">
                            Didn't receive a code ?{" "}
                            <Link
                              to="/auth-pass-reset-cover"
                              className="fw-semibold text-primary text-decoration-underline"
                            >
                              Resend
                            </Link>{" "}
                          </p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
        <footer className="footer">
          <Container>
            <Row>
              <Col lg={12}>
                <div className="text-center">
                  <p className="mb-0">
                    &copy; {new Date().getFullYear()} Crafted with{" "}
                    <i className="mdi mdi-heart text-danger"></i> by Kamacash
                  </p>
                </div>
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
    </React.Fragment>
  );
};

export default TwosVerify;
