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

const OfferPerformance = () => {
  const [vendorPerformanceData, setVendorPerformanceData] = useState([]);
  const [vendorPerformanceLoading, setVendorPerformanceLoading] = useState(false);
  const lastPerformanceRef = useRef(false);

  const loadVendorPerformance = useCallback(async (force = false) => {
    if (!force && lastPerformanceRef.current) {
      return;
    }
    setVendorPerformanceLoading(true);
    try {
      const res = await AnalyticsAPI.getVendorPerformance();
      if (res?.success) {
        setVendorPerformanceData(res.data);
        lastPerformanceRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVendorPerformanceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendorPerformance();
  }, [loadVendorPerformance]);

  // Aggregate stats on the fly
  const totalUnits = vendorPerformanceData.reduce((sum, row) => sum + (row.total_units_claimed || 0), 0);
  const totalGross = vendorPerformanceData.reduce((sum, row) => sum + (row.gross_minor || 0), 0);
  const totalNet = vendorPerformanceData.reduce((sum, row) => sum + (row.net_minor || 0), 0);
  const uniqueOffersCount = vendorPerformanceData.length;

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Offer Performance" />

        {vendorPerformanceLoading ? (
          <Loader />
        ) : (
          <>
            {vendorPerformanceData.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Surplus Units Claimed
                      </small>
                      <h3 className="fw-bold text-info mb-0">{totalUnits} units</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Gross Revenue
                      </small>
                      <h3 className="fw-bold text-dark mb-0">{formatCurrency(totalGross)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Net Revenue Payout
                      </small>
                      <h3 className="fw-bold text-success mb-0">{formatCurrency(totalNet)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Active Packages Offered
                      </small>
                      <h3 className="fw-bold text-primary mb-0">{uniqueOffersCount} packages</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-transparent border-0">
                <h5 className="card-title mb-0">Surplus Package Offer Breakdown</h5>
              </CardHeader>
              <CardBody className="pt-0">
                {vendorPerformanceData.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No surplus packages sold.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: "80px" }}>SQN</th>
                          <th>Offer Name</th>
                          <th>Units Claimed</th>
                          <th>Gross revenue</th>
                          <th>Platform Commission Slice</th>
                          <th>Net Revenue Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorPerformanceData.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            <td className="text-muted">{idx + 1}</td>
                            <td className="fw-semibold text-primary">{row.offer_name}</td>
                            <td>{row.total_units_claimed} units</td>
                            <td>{row.gross_formatted}</td>
                            <td className="text-danger">{row.commission_formatted}</td>
                            <td className="text-success fw-bold">{row.net_formatted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
};

export default OfferPerformance;
