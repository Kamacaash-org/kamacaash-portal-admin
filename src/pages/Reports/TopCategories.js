import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { AnalyticsAPI } from "../../helpers/backend_helper";

const TopCategories = () => {
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadCategories = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) {
      return;
    }
    setLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminCategories();
      if (res?.success) {
        setTopCategories(res.data);
        fetchedRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Aggregate stats on the fly
  const totalVolume = topCategories.reduce((sum, row) => sum + (row.gross_minor || 0), 0);
  const topCategoryName = topCategories[0]?.category_name || "N/A";
  const categoriesCount = topCategories.length;

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Top Categories Leaderboard" />

        {loading ? (
          <Loader />
        ) : (
          <>
            {topCategories.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Categories Volume
                      </small>
                      <h3 className="fw-bold text-success mb-0">{formatCurrency(totalVolume)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Leading Category
                      </small>
                      <h3 className="fw-bold text-primary mb-0">{topCategoryName}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Ranked Categories
                      </small>
                      <h3 className="fw-bold text-info mb-0">{categoriesCount} active</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <Row>
              <Col lg={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h5 className="card-title mb-0">Top 5 Revenue-Generating Categories</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {topCategories.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No category volume data found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Merchant Category Name</th>
                              <th>Total Gross Volume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topCategories.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td className="text-muted">{idx + 1}</td>
                                <td className="fw-semibold text-primary">{row.category_name}</td>
                                <td className="text-success fw-bold">{row.gross_formatted}</td>
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

export default TopCategories;
