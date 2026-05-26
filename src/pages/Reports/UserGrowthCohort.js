import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Button
} from "reactstrap";
import Flatpickr from "react-flatpickr";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { AnalyticsAPI } from "../../helpers/backend_helper";

const UserGrowthCohort = () => {
  const [cohortFromDate, setCohortFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [cohortToDate, setCohortToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [cohortInterval, setCohortInterval] = useState("day");
  const [cohortData, setCohortData] = useState([]);
  const [cohortLoading, setCohortLoading] = useState(false);
  const lastCohortRangeRef = useRef({ from: "", to: "", interval: "" });

  const loadCohortData = useCallback(async (force = false) => {
    const isSame =
      lastCohortRangeRef.current.from === cohortFromDate &&
      lastCohortRangeRef.current.to === cohortToDate &&
      lastCohortRangeRef.current.interval === cohortInterval;

    if (!force && isSame) {
      return;
    }

    setCohortLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminUserIngestion(
        cohortFromDate,
        cohortToDate,
        cohortInterval
      );
      if (res?.success) {
        setCohortData(res.data);
        lastCohortRangeRef.current = {
          from: cohortFromDate,
          to: cohortToDate,
          interval: cohortInterval
        };
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCohortLoading(false);
    }
  }, [cohortFromDate, cohortToDate, cohortInterval]);

  useEffect(() => {
    loadCohortData();
  }, [loadCohortData]);

  // Aggregate stats on the fly
  const totalUsers = cohortData.reduce((sum, row) => sum + (Number(row.new_users_count) || 0), 0);
  const averageRegistrations = cohortData.length > 0
    ? (totalUsers / cohortData.length).toFixed(1)
    : 0;
  const maxRegistrations = cohortData.reduce((max, row) => {
    const val = Number(row.new_users_count) || 0;
    return val > max ? val : max;
  }, 0);

  // Variable to track cumulative sum for rendering
  let runningCumulative = 0;

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="User Growth Cohort" />

        <Card className="border-0 shadow-sm mb-4">
          <CardHeader className="bg-transparent border-0">
            <Row className="g-3 align-items-center">
              <Col md={3}>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted mb-0 text-nowrap">From:</label>
                  <Flatpickr
                    className="form-control"
                    placeholder="Select From"
                    options={{
                      altInput: true,
                      altFormat: "F j, Y",
                      dateFormat: "Y-m-d"
                    }}
                    value={cohortFromDate}
                    onChange={([d]) => {
                      if (d) setCohortFromDate(d.toISOString().split("T")[0]);
                    }}
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted mb-0 text-nowrap">To:</label>
                  <Flatpickr
                    className="form-control"
                    placeholder="Select To"
                    options={{
                      altInput: true,
                      altFormat: "F j, Y",
                      dateFormat: "Y-m-d"
                    }}
                    value={cohortToDate}
                    onChange={([d]) => {
                      if (d) setCohortToDate(d.toISOString().split("T")[0]);
                    }}
                  />
                </div>
              </Col>
              <Col md={2}>
                <select
                  className="form-control"
                  value={cohortInterval}
                  onChange={(e) => setCohortInterval(e.target.value)}
                >
                  <option value="day">Daily Count</option>
                  <option value="month">Monthly Count</option>
                </select>
              </Col>
              <Col md={2}>
                <Button color="primary" onClick={() => loadCohortData(true)}>
                  <i className="ri-filter-3-line align-bottom me-1"></i> Filter
                </Button>
              </Col>
            </Row>
          </CardHeader>
          <CardBody className="pt-0">
            {cohortLoading ? (
              <Loader />
            ) : (
              <>
                {cohortData.length > 0 && (
                  <Row className="g-3 mb-4">
                    <Col xl={4} md={6}>
                      <Card className="border-0 shadow-sm bg-light">
                        <CardBody className="p-3">
                          <small className="text-muted text-uppercase d-block mb-1">
                            Total Registrations
                          </small>
                          <h3 className="fw-bold text-success mb-0">{totalUsers} users</h3>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col xl={4} md={6}>
                      <Card className="border-0 shadow-sm bg-light">
                        <CardBody className="p-3">
                          <small className="text-muted text-uppercase d-block mb-1">
                            Average Registrations / Bucket
                          </small>
                          <h3 className="fw-bold text-primary mb-0">{averageRegistrations} users</h3>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col xl={4} md={6}>
                      <Card className="border-0 shadow-sm bg-light">
                        <CardBody className="p-3">
                          <small className="text-muted text-uppercase d-block mb-1">
                            Peak Registration Spike
                          </small>
                          <h3 className="fw-bold text-danger mb-0">{maxRegistrations} users</h3>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                )}

                {cohortData.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No user registrations found in this range.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: "80px" }}>SQN</th>
                          <th>Time Range / Date Bucket</th>
                          <th>New Users Ingested</th>
                          <th>Cumulative Total Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortData.slice(0, 10).map((row, idx) => {
                          runningCumulative += Number(row.new_users_count) || 0;
                          return (
                            <tr key={idx}>
                              <td className="text-muted">{idx + 1}</td>
                              <td className="fw-semibold">{row.date_bucket}</td>
                              <td className="fw-bold text-success">
                                +{row.new_users_count} users
                              </td>
                              <td className="fw-bold text-primary">
                                {runningCumulative} users
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default UserGrowthCohort;
