import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Badge
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { AnalyticsAPI } from "../../helpers/backend_helper";

const MostFavorited = () => {
  const [mostFavorited, setMostFavorited] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadFavorited = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) {
      return;
    }
    setLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminFavorites();
      if (res?.success) {
        setMostFavorited(res.data);
        fetchedRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorited();
  }, [loadFavorited]);

  // Aggregate stats on the fly
  const totalFavorites = mostFavorited.reduce((sum, row) => sum + (Number(row.favorites_count) || 0), 0);
  const leadingBusinessName = mostFavorited[0]?.business_name || "N/A";
  const businessesCount = mostFavorited.length;

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Most Favorited Businesses" />

        {loading ? (
          <Loader />
        ) : (
          <>
            {mostFavorited.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Organic Bookmarks
                      </small>
                      <h3 className="fw-bold text-danger mb-0">{totalFavorites} bookmarks</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Most Bookmarked Business
                      </small>
                      <h3 className="fw-bold text-primary mb-0">{leadingBusinessName}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Favorited Merchants
                      </small>
                      <h3 className="fw-bold text-info mb-0">{businessesCount} listed</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <Row>
              <Col lg={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h5 className="card-title mb-0">Most Favorited Businesses</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {mostFavorited.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No bookmarks or favorites data found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Business Display Name</th>
                              <th>Organic Bookmarks/Favorites</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mostFavorited.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td className="text-muted">{idx + 1}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    {row.business_logo ? (
                                      <img
                                        src={row.business_logo}
                                        className="rounded-circle"
                                        alt=""
                                        style={{ width: 28, height: 28, objectFit: "cover" }}
                                      />
                                    ) : (
                                      <div
                                        className="avatar-xs rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold"
                                        style={{ width: 28, height: 28 }}
                                      >
                                        {row.business_name?.charAt(0)}
                                      </div>
                                    )}
                                    <span className="fw-semibold">{row.business_name}</span>
                                  </div>
                                </td>
                                <td>
                                  <Badge
                                    color="danger"
                                    className="bg-danger-subtle text-danger border-0 px-3 py-2 rounded-pill"
                                  >
                                    <i className="ri-heart-fill me-1"></i> {row.favorites_count}{" "}
                                    favorites
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default MostFavorited;
