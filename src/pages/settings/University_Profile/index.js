import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Card, CardBody, CardHeader, Col, Container,
    Nav, NavItem, NavLink, Row, TabContent,
    TabPane, Badge, Media,
    Table,
    Button
} from 'reactstrap';
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

import classnames from 'classnames';
import "./SenatorCard.css";
// Images
import profileBg from '../../../assets/images/simad-pic.jpeg';
import avatar1 from '../../../assets/images/logo-simad.png';
import senate1 from '../../../assets/images/users/avatar-1.jpg';
import senate2 from '../../../assets/images/users/avatar-2.jpg';
import senate3 from '../../../assets/images/users/avatar-3.jpg';
import accreditation1 from '../../../assets/images/companies/img-1.png';
import accreditation2 from '../../../assets/images/companies/img-2.png';
import accreditation3 from '../../../assets/images/companies/img-3.png';
import whysimadimg1 from '../../../assets/images/why-simad-img-one.webp';
import whysimadimg2 from '../../../assets/images/why-simad-img-2.webp';

import whysimadimg3 from '../../../assets/images/why-simad-img-3.webp';



// Redux
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';

// Import action
import { getUniversityInfo as onGetUniversityInfo } from "../../../slices/thunks";

const UniversityProfile = () => {
    document.title = "Profile | SIMAD University";

    const dispatch = useDispatch();
    const selectUniData = createSelector(
        (state) => state.Settings,
        (uniData) => uniData.uniData
    );

    const uniData = useSelector(selectUniData);
    const [universityInfo, setUniversityInfo] = useState([]);

    useEffect(() => {
        dispatch(onGetUniversityInfo());
    }, [dispatch]);

    useEffect(() => {
        setUniversityInfo(uniData?.university);
    }, [uniData]);
    console.log("unidata is:", uniData)
    const [activeTab, setActiveTab] = useState('1');

    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    const [whySimadData, setWhySimadData] = useState([
        {
            id: 1,
            title: "Quality Education",
            description: "SIMAD University offers internationally recognized programs with highly qualified faculty members.",
            image: whysimadimg1
        },
        {
            id: 2,
            title: "Modern Facilities",
            description: "Our campus features state-of-the-art laboratories, libraries, and learning spaces.",
            image: whysimadimg2
        },
        {
            id: 3,
            title: "Career Opportunities",
            description: "Strong industry connections provide excellent employment prospects for our graduates.",
            image: whysimadimg3
        },
        {
            id: 2,
            title: "Modern Facilities",
            description: "Our campus features state-of-the-art laboratories, libraries, and learning spaces.",
            image: whysimadimg2
        },
        {
            id: 1,
            title: "Quality Education",
            description: "SIMAD University offers internationally recognized programs with highly qualified faculty members.",
            image: whysimadimg1
        },
        {
            id: 2,
            title: "Modern Facilities",
            description: "Our campus features state-of-the-art laboratories, libraries, and learning spaces.",
            image: whysimadimg2
        },
    ]);

    const [historyData] = useState([
        {
            year: "1999",
            events: [
                "SIMAD University was established",
                "First graduation ceremony held"
            ]
        },
        {
            year: "2005",
            events: [
                "Received accreditation from the Ministry of Education",
                "Introduced postgraduate programs"
            ]
        },
        {
            year: "2018",
            events: [
                "Awarded Best University in Somalia",
                "Launched new Faculty of Engineering"
            ]
        }
    ]);


    // Senate Members Data
    const senateMembers = [
        {
            id: 1,
            name: "Dr. Ahmed Mohamed Hassan",
            position: "Chancellor",
            image: senate1,
            message: "Education is the most powerful weapon which you can use to change the world.",
            bio: "Dr. Ahmed has over 25 years of experience in higher education leadership. He holds a PhD in Educational Management from Harvard University and has published numerous papers on innovative teaching methodologies in developing nations."
        },
        {
            id: 2,
            name: "Prof. Fatima Abdi Ali",
            position: "Vice Chancellor, Academics",
            image: senate2,
            message: "Quality education should be accessible to all, regardless of background or circumstance.",
            bio: "Professor Fatima is a renowned scholar in Economics with a special focus on developmental economics in Africa. She previously served as Dean of the Faculty of Business Administration and has consulted for the World Bank on educational projects."
        },
        {
            id: 3,
            name: "Dr. Omar Abdullahi Mohamud",
            position: "Vice Chancellor, Administration",
            image: senate3,
            message: "Effective administration creates the environment where academic excellence can flourish.",
            bio: "Dr. Omar brings extensive experience in university administration, having previously served as Registrar for 8 years. He holds a Doctorate in Public Administration and has implemented several efficiency-improving systems across university operations."
        },
        {
            id: 4,
            name: "Dr. Aisha Mohamed Nur",
            position: "Dean of Research",
            image: senate1,
            message: "Research that addresses local challenges with global relevance is our priority.",
            bio: "Dr. Aisha leads the university's research initiatives with a focus on practical solutions to regional problems. She has secured over $5M in research grants and established partnerships with 12 international research institutions."
        },
        {
            id: 3,
            name: "Dr. Omar Abdullahi Mohamud",
            position: "Vice Chancellor, Administration",
            image: senate3,
            message: "Effective administration creates the environment where academic excellence can flourish.",
            bio: "Dr. Omar brings extensive experience in university administration, having previously served as Registrar for 8 years. He holds a Doctorate in Public Administration and has implemented several efficiency-improving systems across university operations."
        },
        {
            id: 4,
            name: "Dr. Aisha Mohamed Nur",
            position: "Dean of Research",
            image: senate1,
            message: "Research that addresses local challenges with global relevance is our priority.",
            bio: "Dr. Aisha leads the university's research initiatives with a focus on practical solutions to regional problems. She has secured over $5M in research grants and established partnerships with 12 international research institutions."
        }
    ];



    // Accreditation Data
    const accreditations = [
        {
            id: 1,
            name: "Ministry of Higher Education",
            logo: accreditation1,
            message: "Fully accredited for all undergraduate and graduate programs with distinction in Business and Technology fields.",
            validity: "Permanent"
        },
        {
            id: 2,
            name: "African Higher Education Council",
            logo: accreditation2,
            message: "Recognized as a Center of Excellence for Innovation and Entrepreneurship Education in East Africa.",
            validity: "2022-2027"
        },
        {
            id: 3,
            name: "International Education Standards Board",
            logo: accreditation3,
            message: "Accreditation with commendation for quality assurance processes and graduate outcomes.",
            validity: "2023-2028"
        },
        {
            id: 4,
            name: "Global Business School Network",
            logo: accreditation1,
            message: "Business programs accredited with special recognition for curriculum relevance to emerging markets.",
            validity: "2024-2029"
        },
        {
            id: 3,
            name: "International Education Standards Board",
            logo: accreditation3,
            message: "Accreditation with commendation for quality assurance processes and graduate outcomes.",
            validity: "2023-2028"
        },
        {
            id: 4,
            name: "Global Business School Network",
            logo: accreditation1,
            message: "Business programs accredited with special recognition for curriculum relevance to emerging markets.",
            validity: "2024-2029"
        }
    ];

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
                                        {/* <div><i
                                            className="ri-building-line me-1 text-white text-opacity-75 fs-16 align-middle"></i>Simad ICT Devs
                                        </div> */}
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
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#documents"
                                                className={classnames({ active: activeTab === '2' })}
                                                onClick={() => { toggleTab('2'); }}
                                            >
                                                <i className="ri-folder-4-line d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">Why Simad</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#activities"
                                                className={classnames({ active: activeTab === '3' })}
                                                onClick={() => { toggleTab('3'); }}
                                            >
                                                <i className="ri-list-unordered d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">History & Awards</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#projects"
                                                className={classnames({ active: activeTab === '4' })}
                                                onClick={() => { toggleTab('4'); }}
                                            >
                                                <i className="ri-price-tag-line d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">The Senate</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#documents"
                                                className={classnames({ active: activeTab === '5' })}
                                                onClick={() => { toggleTab('5'); }}
                                            >
                                                <i className="ri-folder-4-line d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">Accreditation</span>
                                            </NavLink>
                                        </NavItem>
                                    </Nav>

                                    < div className="flex-shrink-0">

                                        <Link to="/setting-edit-profile" className="btn btn-success"><i
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
                                                                        className="avatar-title rounded-circle fs-16 bg-primary text-light material-shadow">
                                                                        <i className="ri-facebook-fill"></i>
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
                                                                        className="avatar-title rounded-circle fs-16 bg-dark material-shadow">
                                                                        <i className="ri-tiktok-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-16 bg-danger material-shadow">
                                                                        <i className="ri-youtube-fill"></i>
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
                                                        <h5 className="card-title mb-3">Guiding Principles</h5>
                                                        <p>{universityInfo?.description?.guiding_principles}</p>
                                                        <h5 className="card-title mb-3">Core Values</h5>
                                                        <p>{universityInfo?.description?.core_values}</p>

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
                                    {/* Why SIMAD Tab */}
                                    <TabPane tabId="2">
                                        <Card className="shadow-lg border-0">
                                            <CardHeader className="bg-gradient-primary text-white py-3 d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">
                                                    <i className="fas fa-star me-2"></i>
                                                    Why Choose SIMAD University?
                                                </h5>

                                            </CardHeader>
                                            <CardBody className="p-4">

                                                {/* Cards Display */}
                                                <Row>
                                                    {whySimadData.map((card) => (
                                                        <Col key={card.id} lg={4} md={6} className="mb-4">
                                                            <Card className="h-100 shadow-sm card-hover border-0">
                                                                {card.image && (
                                                                    <div className="card-img-container">
                                                                        <img
                                                                            src={card.image}
                                                                            className="card-img-top"
                                                                            alt={card.title}
                                                                            style={{ height: '200px', objectFit: 'cover' }}
                                                                        />
                                                                        <div className="card-overlay"></div>
                                                                    </div>
                                                                )}
                                                                <CardBody className="d-flex flex-column">
                                                                    <h5 className="card-title text-primary">{card.title}</h5>
                                                                    <p className="card-text flex-grow-1">{card.description}</p>

                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>

                                                {whySimadData.length === 0 && (
                                                    <div className="text-center py-5">
                                                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                        <h5 className="text-muted">No data To be Displayed</h5>

                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </TabPane>

                                    {/* History & Awards Tab */}
                                    <TabPane tabId="3">
                                        <Card>
                                            <CardHeader>
                                                <h5 className="card-title mb-0">University Milestones & Achievements</h5>
                                            </CardHeader>
                                            <CardBody>
                                                <div className="vstack gap-4">
                                                    {historyData.map((item, idx) => (
                                                        <div key={idx} className="d-flex">
                                                            <div className="flex-shrink-0">
                                                                <Badge color="success" pill className="p-2 px-3 fs-16">
                                                                    {item.year}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <ul className="list-unstyled mb-0">
                                                                    {item.events.map((event, eventIdx) => (
                                                                        <li key={eventIdx} className="mb-2 position-relative ps-3">
                                                                            <i className="ri-arrow-right-s-line fs-18 text-success position-absolute start-0 top-1"></i>
                                                                            {event}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </TabPane>

                                    {/* The Senate Tab */}
                                    <TabPane tabId="4">
                                        <Row className="row-cols-1 row-cols-lg-2 g-4">
                                            {senateMembers.map((member, idx) => (
                                                <Col key={idx}>
                                                    <Card className="h-100 senator-card">
                                                        <CardBody className="d-flex flex-column p-4">
                                                            {/* Header with image and basic info */}
                                                            <div className="d-flex align-items-center mb-4">
                                                                <div className="flex-shrink-0">
                                                                    <div className="avatar-wrapper position-relative">
                                                                        <img
                                                                            src={member.image}
                                                                            alt={member.name}
                                                                            className="avatar-lg rounded shadow-sm"
                                                                        />
                                                                        <span className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-2 border-white">
                                                                            <i className="ri-checkbox-circle-fill text-white"></i>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h5 className="card-title mb-1">{member.name}</h5>
                                                                    <p className="text-muted mb-1">{member.position}</p>
                                                                    <div className="d-flex align-items-center">
                                                                        <small className="text-info">
                                                                            <i className="ri-time-line me-1"></i>
                                                                            Member since 2018
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Message section */}
                                                            <div className="mb-4 flex-grow-1">
                                                                <h6 className="fs-14 mb-2 text-primary d-flex align-items-center">
                                                                    <i className="ri-chat-quote-line me-2"></i>Message
                                                                </h6>
                                                                <div className="bg-light rounded p-3">
                                                                    <p className="mb-0 fst-italic text-dark">"{member.message}"</p>
                                                                </div>
                                                            </div>

                                                            {/* Biography section with show more/less functionality */}
                                                            <div className="mb-4 flex-grow-1">
                                                                <h6 className="fs-14 mb-2 text-primary d-flex align-items-center">
                                                                    <i className="ri-file-list-3-line me-2"></i>Biography
                                                                </h6>
                                                                <div className="bio-container">
                                                                    <p className="text-muted mb-0">
                                                                        {member.bio.length > 150 ? `${member.bio.substring(0, 150)}...` : member.bio}
                                                                    </p>
                                                                    {member.bio.length > 150 && (
                                                                        <button
                                                                            className="btn btn-link p-0 text-decoration-none mt-1"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                const bioElem = e.target.closest('.bio-container').querySelector('p');
                                                                                if (bioElem.classList.contains('expanded')) {
                                                                                    bioElem.classList.remove('expanded');
                                                                                    bioElem.textContent = `${member.bio.substring(0, 150)}...`;
                                                                                    e.target.textContent = 'Read more';
                                                                                } else {
                                                                                    bioElem.classList.add('expanded');
                                                                                    bioElem.textContent = member.bio;
                                                                                    e.target.textContent = 'Read less';
                                                                                }
                                                                            }}
                                                                        >
                                                                            <small>Read more</small>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Action buttons at bottom */}
                                                            <div className="mt-auto pt-3 border-top">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div className="d-flex align-items-center">
                                                                        <span className="badge bg-info bg-opacity-10 text-info me-2">
                                                                            <i className="ri-medal-line me-1"></i>Leadership
                                                                        </span>
                                                                        <span className="badge bg-success bg-opacity-10 text-success">
                                                                            <i className="ri-group-line me-1"></i>Faculty
                                                                        </span>
                                                                    </div>
                                                                    {/* <div className="hstack gap-2">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-icon btn-soft-primary btn-sm rounded-circle"
                                                                            title="Connect on LinkedIn"
                                                                        >
                                                                            <i className="ri-linkedin-fill"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-icon btn-soft-info btn-sm rounded-circle"
                                                                            title="Send message"
                                                                        >
                                                                            <i className="ri-mail-line"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-icon btn-soft-success btn-sm rounded-circle"
                                                                            title="View profile"
                                                                        >
                                                                            <i className="ri-profile-line"></i>
                                                                        </button>
                                                                    </div> */}
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                        <br />

                                    </TabPane>

                                    {/* Accreditation Tab */}
                                    <TabPane tabId="5">
                                        <Row className="row-cols-1 row-cols-lg-2 g-4">
                                            {accreditations.map((item, idx) => (
                                                <Col key={idx}>
                                                    <Card className="h-100"> {/* Add h-100 class to make card full height */}
                                                        <CardBody className="d-flex flex-column"> {/* Use flex column layout */}
                                                            <div className="d-flex mb-3">
                                                                <div className="flex-shrink-0">
                                                                    <img src={item.logo} alt="" className="avatar-md" />
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h5 className="card-title mb-1">{item.name}</h5>
                                                                    <Badge color="success" className="badge bg-success-subtle text-success">
                                                                        <i className="ri-shield-check-line align-bottom me-1"></i> Accredited
                                                                    </Badge>
                                                                    <p className="text-muted mb-0 mt-2">Valid until: {item.validity}</p>
                                                                </div>
                                                            </div>

                                                            {/* This div will grow to fill available space, pushing button to bottom */}
                                                            <div className="flex-grow-1">
                                                                <p className="text-muted">{item.message}</p>
                                                            </div>

                                                            {/* <div className="mt-3">
                                                                <Link to="#" className="btn btn-soft-primary btn-sm">
                                                                    <i className="ri-file-pdf-line align-bottom me-1"></i> View Certificate
                                                                </Link>
                                                            </div> */}
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                        <br />
                                        {/* <Card className="mt-4">
                                            <CardHeader>
                                                <h5 className="card-title mb-0">Accreditation Status</h5>
                                            </CardHeader>
                                            <CardBody>
                                                <div className="table-responsive">
                                                    <table className="table table-bordered mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th scope="col">Program</th>
                                                                <th scope="col">Accreditation Body</th>
                                                                <th scope="col">Status</th>
                                                                <th scope="col">Valid Until</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>Business Administration</td>
                                                                <td>International Accreditation Council</td>
                                                                <td><Badge color="success">Fully Accredited</Badge></td>
                                                                <td>2027</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Computer Science</td>
                                                                <td>Technology Education Board</td>
                                                                <td><Badge color="success">Fully Accredited</Badge></td>
                                                                <td>2026</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Engineering</td>
                                                                <td>Engineering Accreditation Commission</td>
                                                                <td><Badge color="warning">Provisional</Badge></td>
                                                                <td>2025</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Medicine</td>
                                                                <td>Medical Education Council</td>
                                                                <td><Badge color="info">In Process</Badge></td>
                                                                <td>-</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardBody>
                                        </Card> */}
                                    </TabPane>
                                </TabContent>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment >
    );
};

export default UniversityProfile;