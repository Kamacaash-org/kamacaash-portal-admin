import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, Input, Label, Nav, NavItem, NavLink, Pagination, PaginationItem, PaginationLink, Progress, Row, TabContent, Table, TabPane, UncontrolledCollapse, UncontrolledDropdown } from 'reactstrap';
import classnames from 'classnames';
import { Autoplay } from "swiper/modules";
import SwiperCore from "swiper";


//Images
import profileBg from '../../../assets/images/simad-pic.jpeg';
import avatar1 from '../../../assets/images/logo-simad.png';

//redux
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';

//import action
import {
    getUniversityInfo as onGetUniversityInfo
} from "../../../slices/thunks";


const UniversityProfile = () => {
    document.title = "Profile | SIMAD University";

    const dispatch = useDispatch();
    const selectUniData = createSelector(
        (state) => state.Settings,
        (uniData) => uniData.uniData
    );
    // Inside your component
    const uniData = useSelector(selectUniData);
    const [universityInfo, setUniversityInfo] = useState([]);


    useEffect(() => {

        dispatch(onGetUniversityInfo());
    }, [dispatch]);

    useEffect(() => {
        setUniversityInfo(uniData?.data?.universityInfo);
    }, [uniData]);
    // console.log("uni info is", universityInfo)

    SwiperCore.use([Autoplay]);

    const [activeTab, setActiveTab] = useState('1');

    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="profile-foreground position-relative mx-n4 mt-n4">
                        <div className="profile-wid-bg">
                            <img src={profileBg} alt="" className="profile-wid-img" />
                        </div>
                    </div>
                    <div className="pt-4 mb-4 mb-lg-3 pb-lg-4">
                        <Row className="g-4">
                            <div className="col-auto">
                                <div className="avatar-lg">
                                    <img src={avatar1} alt="user-img"
                                        className="img-thumbnail rounded-circle" />
                                </div>
                            </div>

                            <Col>
                                <div className="p-2">
                                    <h3 className="text-white mb-1">{universityInfo?.name || "SIMAD University"}</h3>
                                    <p className="text-white text-opacity-75">{universityInfo?.type || "Private"} higher education institution</p>
                                    <div className="hstack text-white-50 gap-1">
                                        <div className="me-2"><i
                                            className="ri-map-pin-user-line me-1 text-white text-opacity-75 fs-16 align-middle"></i> {universityInfo?.address?.city + ", " + universityInfo?.address?.country || "Mogadishu, Somalia"} </div>
                                        <div><i
                                            className="ri-building-line me-1 text-white text-opacity-75 fs-16 align-middle"></i>Simad ICT Devs
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={12} className="col-lg-auto order-last order-lg-0">
                                <Row className="text text-white-50 text-center">
                                    <Col lg={6} xs={4}>
                                        <div className="p-2">
                                            <h4 className="text-white mb-1">{universityInfo?.stats?.students}+</h4>
                                            <p className="fs-14 mb-0">Students</p>
                                        </div>
                                    </Col>
                                    <Col lg={6} xs={4}>
                                        <div className="p-2">
                                            <h4 className="text-white mb-1">{universityInfo?.stats?.alumni}+</h4>
                                            <p className="fs-14 mb-0">Alumni</p>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <div>
                                <div className="d-flex">
                                    <Nav pills className="animation-nav profile-nav gap-2 gap-lg-3 flex-grow-1"
                                        role="tablist">
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#overview-tab"
                                                className={classnames({ active: activeTab === '1' })}
                                                onClick={() => { toggleTab('1'); }}

                                            >
                                                <i className="ri-airplay-fill d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">Overview</span>
                                            </NavLink>
                                        </NavItem>

                                    </Nav>
                                    <div className="flex-shrink-0">
                                        <Link to="/pages-profile-settings" className="btn btn-success"><i
                                            className="ri-edit-box-line align-bottom"></i> Edit Profile</Link>
                                    </div>
                                </div>

                                <TabContent activeTab={activeTab} className="pt-4">
                                    <TabPane tabId="1">
                                        <Row>
                                            <Col xxl={4}>


                                                <Card>
                                                    <CardBody>
                                                        <h5 className="card-title mb-3">Info</h5>
                                                        <div className="table-responsive">
                                                            <Table className="table-borderless mb-0">
                                                                <tbody>

                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Address</th>
                                                                        <td className="text-muted">	{universityInfo?.address?.street + ", " + universityInfo?.address?.city + ", " + universityInfo?.address?.state + ", " + universityInfo?.address?.country || "Jidka Warshaddaha, Mogadishu, Benadir, Somalia"}</td>
                                                                    </tr>

                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Motto</th>
                                                                        <td className="text-muted">{universityInfo?.motto || "The Fountain of Knowledge and Wisdom"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Mobile :</th>
                                                                        <td className="text-muted">{universityInfo?.contact?.phone || "+(252) 61 9924646"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Founded</th>
                                                                        <td className="text-muted">{universityInfo?.founded || "November 6, 1999"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">E-mail :</th>
                                                                        <td className="text-muted">{universityInfo?.contact?.email || "registrar@simad.edu.so"}</td>
                                                                    </tr>

                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Language</th>
                                                                        <td className="text-muted">	{universityInfo?.academics?.language || "Somali language"}</td>
                                                                    </tr>


                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Colors</th>
                                                                        <td className="text-muted">{universityInfo?.colors || "Green, Blue"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Former names</th>
                                                                        <td className="text-muted">{universityInfo?.formerNames || "Simad for Somali Institute of Management and Administration Development"}</td>
                                                                    </tr>


                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Academic</th>
                                                                        <td className="text-muted">{universityInfo?.academics?.affiliation || "Africa Muslims Agency"}</td>
                                                                    </tr>

                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Other name</th>
                                                                        <td className="text-muted">{universityInfo?.otherNames || "Abb. SU"}</td>
                                                                    </tr>

                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardBody>
                                                        <h5 className="card-title mb-4">Portfolio</h5>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-16 bg-dark text-light material-shadow">
                                                                        <i className="ri-github-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-16 bg-primary material-shadow">
                                                                        <i className="ri-global-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-16 bg-success material-shadow">
                                                                        <i className="ri-dribbble-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-16 bg-danger material-shadow">
                                                                        <i className="ri-pinterest-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                            </Col>
                                            <Col xxl={8}>
                                                <Card>
                                                    <CardBody>
                                                        <h5 className="card-title mb-3">mission</h5>
                                                        <p>{universityInfo?.description?.mission}</p>
                                                        <h5 className="card-title mb-3">vision</h5>

                                                        <p>{universityInfo?.description?.vision}</p>
                                                        <h5 className="card-title mb-3">history</h5>

                                                        <p>{universityInfo?.description?.history}</p>
                                                        <h5 className="card-title mb-3">achievements</h5>

                                                        <p>{universityInfo?.description?.achievements}</p>
                                                        <br></br>

                                                        <Row>
                                                            <Col xs={6} md={4}>
                                                                <div className="d-flex mt-4">
                                                                    <div
                                                                        className="flex-shrink-0 avatar-xs align-self-center me-3">
                                                                        <div
                                                                            className="avatar-title bg-light rounded-circle fs-16 text-primary material-shadow">
                                                                            <i className="ri-user-2-fill"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 overflow-hidden">
                                                                        <p className="mb-1">Type :</p>
                                                                        <h6 className="text-truncate mb-0"> <strong>{universityInfo?.type + " University"}</strong></h6>
                                                                    </div>
                                                                </div>
                                                            </Col>

                                                            <Col xs={6} md={4}>
                                                                <div className="d-flex mt-4">
                                                                    <div
                                                                        className="flex-shrink-0 avatar-xs align-self-center me-3">
                                                                        <div
                                                                            className="avatar-title bg-light rounded-circle fs-16 text-primary material-shadow">
                                                                            <i className="ri-global-line"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 overflow-hidden">
                                                                        <p className="mb-1">Website :</p>
                                                                        <Link to={universityInfo?.contact?.website} className="fw-semibold">www.simad.edu.so</Link>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>



                                            </Col>
                                        </Row>
                                    </TabPane>

                                </TabContent>
                            </div>
                        </Col>
                    </Row>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default UniversityProfile;