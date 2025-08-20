import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
    Card, CardBody, CardHeader, Col, Container,
    Nav, NavItem, NavLink, Row, TabContent,
    TabPane, Form, FormGroup, Label, Input,
    Button, Badge, Alert
} from 'reactstrap';
import classnames from 'classnames';

// Images (same as profile page)
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

import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import Quill from 'quill';

const UniversityProfileEdit = () => {
    document.title = "Edit Profile | SIMAD University";
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('1');
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
    const { quillRef } = useQuill();
    const missionRef = useRef(null);
    const visionRef = useRef(null);
    const historyRef = useRef(null);
    const achievementsRef = useRef(null);
    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    useEffect(() => {
        if (missionRef.current) {
            new Quill(missionRef.current, { theme: "snow" });
        }
        if (visionRef.current) {
            new Quill(visionRef.current, { theme: "snow" });
        }
        if (historyRef.current) {
            new Quill(historyRef.current, { theme: "snow" });
        }
        if (achievementsRef.current) {
            new Quill(achievementsRef.current, { theme: "snow" });
        }
    }, []);

    // Sample initial data - in a real app, this would come from an API
    const [universityInfo, setUniversityInfo] = useState({
        name: "SIMAD University",
        type: "Private",
        address: {
            street: "Jidka Warshaddaha",
            city: "Mogadishu",
            state: "Benadir",
            country: "Somalia"
        },
        motto: "The Fountain of Knowledge and Wisdom",
        contact: {
            phone: "+(252) 61 9924646",
            email: "registrar@simad.edu.so",
            website: "https://www.simad.edu.so"
        },
        founded: "November 6, 1999",
        academics: {
            language: "Somali language",
            affiliation: "Africa Muslims Agency"
        },
        colors: "Green, Blue",
        formerNames: "Simad for Somali Institute of Management and Administration Development",
        otherNames: "Abb. SU",
        stats: {
            students: 5000,
            alumni: 15000
        },
        description: {
            mission: "To provide quality higher education that prepares students for leadership and service through innovative teaching, research, and community engagement.",
            vision: "To be a leading university in Africa recognized for academic excellence and innovation.",
            history: "Established in 1999, SIMAD University has grown from a small institute to one of Somalia's premier higher education institutions, serving thousands of students across multiple faculties.",
            achievements: "Multiple awards for educational excellence, recognized by international accreditation bodies, and a track record of producing graduates who excel in their fields."
        }
    });

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
        }
    ]);

    const [historyData, setHistoryData] = useState([
        {
            id: 1,
            year: "1999",
            events: [
                "SIMAD University was established",
                "First graduation ceremony held"
            ]
        },
        {
            id: 2,
            year: "2005",
            events: [
                "Received accreditation from the Ministry of Education",
                "Introduced postgraduate programs"
            ]
        },
        {
            id: 3,
            year: "2018",
            events: [
                "Awarded Best University in Somalia",
                "Launched new Faculty of Engineering"
            ]
        }
    ]);

    const [senateMembers, setSenateMembers] = useState([
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
        }
    ]);

    const [accreditations, setAccreditations] = useState([
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
        }
    ]);

    // Handle input changes for university info
    const handleInputChange = (e, section, field, subfield = null) => {
        const value = e.target.value;

        if (subfield) {
            setUniversityInfo(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [subfield]: value
                }
            }));
        } else if (section) {
            setUniversityInfo(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        } else {
            setUniversityInfo(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Handle changes for why SIMAD items
    const handleWhySimadChange = (index, field, value) => {
        const updatedData = [...whySimadData];
        updatedData[index][field] = value;
        setWhySimadData(updatedData);
    };

    // Handle adding new why SIMAD item
    const addWhySimadItem = () => {
        setWhySimadData([
            ...whySimadData,
            {
                id: whySimadData.length + 1,
                title: "",
                description: "",
                image: ""
            }
        ]);
    };

    // Handle removing why SIMAD item
    const removeWhySimadItem = (index) => {
        if (whySimadData.length > 1) {
            const updatedData = [...whySimadData];
            updatedData.splice(index, 1);
            setWhySimadData(updatedData);
        }
    };

    // Handle changes for history items
    const handleHistoryChange = (index, field, value) => {
        const updatedData = [...historyData];
        updatedData[index][field] = value;
        setHistoryData(updatedData);
    };

    // Handle changes for history events
    const handleHistoryEventChange = (historyIndex, eventIndex, value) => {
        const updatedData = [...historyData];
        updatedData[historyIndex].events[eventIndex] = value;
        setHistoryData(updatedData);
    };

    // Add new history item
    const addHistoryItem = () => {
        setHistoryData([
            ...historyData,
            {
                id: historyData.length + 1,
                year: "",
                events: [""]
            }
        ]);
    };

    // Add event to history item
    const addHistoryEvent = (index) => {
        const updatedData = [...historyData];
        updatedData[index].events.push("");
        setHistoryData(updatedData);
    };

    // Remove history item
    const removeHistoryItem = (index) => {
        if (historyData.length > 1) {
            const updatedData = [...historyData];
            updatedData.splice(index, 1);
            setHistoryData(updatedData);
        }
    };

    // Remove event from history item
    const removeHistoryEvent = (historyIndex, eventIndex) => {
        const updatedData = [...historyData];
        if (updatedData[historyIndex].events.length > 1) {
            updatedData[historyIndex].events.splice(eventIndex, 1);
            setHistoryData(updatedData);
        }
    };

    // Handle changes for senate members
    const handleSenateChange = (index, field, value) => {
        const updatedData = [...senateMembers];
        updatedData[index][field] = value;
        setSenateMembers(updatedData);
    };

    // Add new senate member
    const addSenateMember = () => {
        setSenateMembers([
            ...senateMembers,
            {
                id: senateMembers.length + 1,
                name: "",
                position: "",
                image: "",
                message: "",
                bio: ""
            }
        ]);
    };

    // Remove senate member
    const removeSenateMember = (index) => {
        if (senateMembers.length > 1) {
            const updatedData = [...senateMembers];
            updatedData.splice(index, 1);
            setSenateMembers(updatedData);
        }
    };

    // Handle changes for accreditations
    const handleAccreditationChange = (index, field, value) => {
        const updatedData = [...accreditations];
        updatedData[index][field] = value;
        setAccreditations(updatedData);
    };

    // Add new accreditation
    const addAccreditation = () => {
        setAccreditations([
            ...accreditations,
            {
                id: accreditations.length + 1,
                name: "",
                logo: "",
                message: "",
                validity: ""
            }
        ]);
    };

    // Remove accreditation
    const removeAccreditation = (index) => {
        if (accreditations.length > 1) {
            const updatedData = [...accreditations];
            updatedData.splice(index, 1);
            setAccreditations(updatedData);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // In a real application, you would make API calls here
            // For demonstration, we'll simulate an API call
            setSaveStatus({ type: 'info', message: 'Saving changes...' });

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // This is where you would send data to your backend
            console.log('Submitting data:', {
                universityInfo,
                whySimadData,
                historyData,
                senateMembers,
                accreditations
            });

            setSaveStatus({ type: 'success', message: 'Changes saved successfully!' });
            await new Promise(resolve => setTimeout(resolve, 2000));

            navigate("/setting-profile");
        } catch (error) {
            setSaveStatus({ type: 'danger', message: 'Error saving changes. Please try again.' });
        }
    };

    return (
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
                                <img src={avatar1} alt="user-img" className="img-thumbnail rounded-circle" />
                            </div>
                        </div>

                        <Col>
                            <div className="p-2">
                                <h3 className="text-white mb-1">Edit University Profile</h3>
                                <p className="text-white text-opacity-75">Update and manage all university information</p>
                            </div>
                        </Col>

                        <Col xs={12} className="col-lg-auto order-last order-lg-0">
                            <div className="d-flex gap-2 mt-3 mt-lg-0">
                                <Link to="/setting-profile" className="btn btn-light">
                                    <i className="ri-arrow-left-line align-bottom me-1"></i> Back to Profile
                                </Link>
                                <Button color="success" onClick={handleSubmit}>
                                    <i className="ri-save-line align-bottom me-1"></i> Save Changes
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>

                {saveStatus.message && (
                    <Alert color={saveStatus.type} className="mt-3">
                        {saveStatus.message}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={12}>
                            <div>
                                <div className="d-flex profile-edit-tabs">
                                    <Nav pills className="animation-nav profile-nav gap-2 gap-lg-3 flex-grow-1" role="tablist">
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '1' })}
                                                onClick={() => { toggleTab('1'); }}
                                            >
                                                <i className="ri-airplay-fill d-inline-block d-md-none"></i>
                                                <span className="d-none d-md-inline-block">Overview</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '2' })}
                                                onClick={() => { toggleTab('2'); }}
                                            >
                                                <i className="ri-star-fill d-inline-block d-md-none"></i>
                                                <span className="d-none d-md-inline-block">Why SIMAD</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '3' })}
                                                onClick={() => { toggleTab('3'); }}
                                            >
                                                <i className="ri-history-fill d-inline-block d-md-none"></i>
                                                <span className="d-none d-md-inline-block">History & Awards</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '4' })}
                                                onClick={() => { toggleTab('4'); }}
                                            >
                                                <i className="ri-team-fill d-inline-block d-md-none"></i>
                                                <span className="d-none d-md-inline-block">The Senate</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '5' })}
                                                onClick={() => { toggleTab('5'); }}
                                            >
                                                <i className="ri-verified-badge-fill d-inline-block d-md-none"></i>
                                                <span className="d-none d-md-inline-block">Accreditation</span>
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                </div>

                                <TabContent activeTab={activeTab} className="pt-4">
                                    {/* Overview Tab */}
                                    <TabPane tabId="1">
                                        <Row>
                                            <Col xxl={6}>
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="card-title mb-0">Basic Information</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <FormGroup>
                                                            <Label for="name">University Name</Label>
                                                            <Input
                                                                type="text"
                                                                id="name"
                                                                value={universityInfo.name}
                                                                onChange={(e) => handleInputChange(e, null, 'name')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="type">University Type</Label>
                                                            <Input
                                                                type="select"
                                                                id="type"
                                                                value={universityInfo.type}
                                                                onChange={(e) => handleInputChange(e, null, 'type')}
                                                            >
                                                                <option value="Private">Private</option>
                                                                <option value="Public">Public</option>
                                                            </Input>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="motto">Motto</Label>
                                                            <Input
                                                                type="text"
                                                                id="motto"
                                                                value={universityInfo.motto}
                                                                onChange={(e) => handleInputChange(e, null, 'motto')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="founded">Founded Date</Label>
                                                            <Input
                                                                type="text"
                                                                id="founded"
                                                                value={universityInfo.founded}
                                                                onChange={(e) => handleInputChange(e, null, 'founded')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="colors">Colors</Label>
                                                            <Input
                                                                type="text"
                                                                id="colors"
                                                                value={universityInfo.colors}
                                                                onChange={(e) => handleInputChange(e, null, 'colors')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="formerNames">Former Names</Label>
                                                            <Input
                                                                type="text"
                                                                id="formerNames"
                                                                value={universityInfo.formerNames}
                                                                onChange={(e) => handleInputChange(e, null, 'formerNames')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="otherNames">Other Names</Label>
                                                            <Input
                                                                type="text"
                                                                id="otherNames"
                                                                value={universityInfo.otherNames}
                                                                onChange={(e) => handleInputChange(e, null, 'otherNames')}
                                                            />
                                                        </FormGroup>
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="card-title mb-0">Statistics</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <FormGroup>
                                                            <Label for="students">Number of Students</Label>
                                                            <Input
                                                                type="number"
                                                                id="students"
                                                                value={universityInfo.stats?.students}
                                                                onChange={(e) => handleInputChange(e, 'stats', 'students')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="alumni">Number of Alumni</Label>
                                                            <Input
                                                                type="number"
                                                                id="alumni"
                                                                value={universityInfo.stats?.alumni}
                                                                onChange={(e) => handleInputChange(e, 'stats', 'alumni')}
                                                            />
                                                        </FormGroup>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col xxl={6}>
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="card-title mb-0">Contact Information</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <FormGroup>
                                                            <Label for="street">Street Address</Label>
                                                            <Input
                                                                type="text"
                                                                id="street"
                                                                value={universityInfo.address?.street}
                                                                onChange={(e) => handleInputChange(e, 'address', 'street')}
                                                            />
                                                        </FormGroup>

                                                        <Row>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="city">City</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="city"
                                                                        value={universityInfo.address?.city}
                                                                        onChange={(e) => handleInputChange(e, 'address', 'city')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="state">State/Region</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="state"
                                                                        value={universityInfo.address?.state}
                                                                        onChange={(e) => handleInputChange(e, 'address', 'state')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>

                                                        <FormGroup>
                                                            <Label for="country">Country</Label>
                                                            <Input
                                                                type="text"
                                                                id="country"
                                                                value={universityInfo.address?.country}
                                                                onChange={(e) => handleInputChange(e, 'address', 'country')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="phone">Phone Number</Label>
                                                            <Input
                                                                type="text"
                                                                id="phone"
                                                                value={universityInfo.contact?.phone}
                                                                onChange={(e) => handleInputChange(e, 'contact', 'phone')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="email">Email Address</Label>
                                                            <Input
                                                                type="email"
                                                                id="email"
                                                                value={universityInfo.contact?.email}
                                                                onChange={(e) => handleInputChange(e, 'contact', 'email')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="website">Website</Label>
                                                            <Input
                                                                type="url"
                                                                id="website"
                                                                value={universityInfo.contact?.website}
                                                                onChange={(e) => handleInputChange(e, 'contact', 'website')}
                                                            />
                                                        </FormGroup>
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="card-title mb-0">Academic Information</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <FormGroup>
                                                            <Label for="language">Language of Instruction</Label>
                                                            <Input
                                                                type="text"
                                                                id="language"
                                                                value={universityInfo.academics?.language}
                                                                onChange={(e) => handleInputChange(e, 'academics', 'language')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="affiliation">Affiliation</Label>
                                                            <Input
                                                                type="text"
                                                                id="affiliation"
                                                                value={universityInfo.academics?.affiliation}
                                                                onChange={(e) => handleInputChange(e, 'academics', 'affiliation')}
                                                            />
                                                        </FormGroup>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col xs={12}>
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="card-title mb-0">Descriptions</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <FormGroup>
                                                            <Label for="mission">Mission Statement</Label>
                                                            {/* <Input
                                                                type="textarea"
                                                                id="mission"
                                                                rows="3"
                                                                value={universityInfo.description?.mission}
                                                                onChange={(e) => handleInputChange(e, 'description', 'mission')}
                                                            /> */}
                                                            <div className="snow-editor" style={{ height: 300 }}>
                                                                <div ref={missionRef} />
                                                            </div>

                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="vision">Vision Statement</Label>
                                                            {/* <Input
                                                                type="textarea"
                                                                id="vision"
                                                                rows="3"
                                                                value={universityInfo.description?.vision}
                                                                onChange={(e) => handleInputChange(e, 'description', 'vision')}
                                                            /> */}

                                                            <div className="snow-editor" style={{ height: 300 }}>
                                                                <div ref={visionRef} />
                                                            </div>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="history">History</Label>
                                                            {/* <Input
                                                                type="textarea"
                                                                id="history"
                                                                rows="4"
                                                                value={universityInfo.description?.history}
                                                                onChange={(e) => handleInputChange(e, 'description', 'history')}
                                                            /> */}
                                                            <div className="snow-editor" style={{ height: 300 }}>
                                                                <div ref={historyRef} />
                                                            </div>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="achievements">Achievements & Core Values</Label>
                                                            {/* <Input
                                                                type="textarea"
                                                                id="achievements"
                                                                rows="4"
                                                                value={universityInfo.description?.achievements}
                                                                onChange={(e) => handleInputChange(e, 'description', 'achievements')}
                                                            /> */}
                                                            <div className="snow-editor" style={{ height: 300 }}>
                                                                <div ref={achievementsRef} />
                                                            </div>

                                                        </FormGroup>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Why SIMAD Tab */}
                                    <TabPane tabId="2">
                                        <Card>
                                            <CardHeader className="d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">Why Choose SIMAD University</h5>
                                                <Button color="primary" size="sm" onClick={addWhySimadItem}>
                                                    <i className="ri-add-line align-bottom me-1"></i> Add Item
                                                </Button>
                                            </CardHeader>
                                            <CardBody>
                                                {whySimadData.map((item, index) => (
                                                    <Card key={index} className="mb-4">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h6 className="mb-0">Item #{index + 1}</h6>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeWhySimadItem(index)}
                                                                    disabled={whySimadData.length <= 1}
                                                                >
                                                                    <i className="ri-delete-bin-line align-bottom"></i>
                                                                </Button>
                                                            </div>

                                                            <FormGroup>
                                                                <Label for={`why-title-${index}`}>Title</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`why-title-${index}`}
                                                                    value={item.title}
                                                                    onChange={(e) => handleWhySimadChange(index, 'title', e.target.value)}
                                                                />
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`why-desc-${index}`}>Description</Label>
                                                                <Input
                                                                    type="textarea"
                                                                    id={`why-desc-${index}`}
                                                                    rows="3"
                                                                    value={item.description}
                                                                    onChange={(e) => handleWhySimadChange(index, 'description', e.target.value)}
                                                                />
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`why-image-${index}`}>Image URL</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`why-image-${index}`}
                                                                    value={item.image}
                                                                    onChange={(e) => handleWhySimadChange(index, 'image', e.target.value)}
                                                                />
                                                                {item.image && (
                                                                    <div className="mt-2">
                                                                        <img
                                                                            src={item.image}
                                                                            alt="Preview"
                                                                            className="img-thumbnail"
                                                                            style={{ maxHeight: '150px' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </FormGroup>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </CardBody>
                                        </Card>
                                    </TabPane>

                                    {/* History & Awards Tab */}
                                    <TabPane tabId="3">
                                        <Card>
                                            <CardHeader className="d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">University History & Milestones</h5>
                                                <Button color="primary" size="sm" onClick={addHistoryItem}>
                                                    <i className="ri-add-line align-bottom me-1"></i> Add Milestone
                                                </Button>
                                            </CardHeader>
                                            <CardBody>
                                                {historyData.map((item, historyIndex) => (
                                                    <Card key={historyIndex} className="mb-4">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h6 className="mb-0">Milestone #{historyIndex + 1}</h6>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeHistoryItem(historyIndex)}
                                                                    disabled={historyData.length <= 1}
                                                                >
                                                                    <i className="ri-delete-bin-line align-bottom"></i>
                                                                </Button>
                                                            </div>

                                                            <FormGroup>
                                                                <Label for={`history-year-${historyIndex}`}>Year</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`history-year-${historyIndex}`}
                                                                    value={item.year}
                                                                    onChange={(e) => handleHistoryChange(historyIndex, 'year', e.target.value)}
                                                                />
                                                            </FormGroup>

                                                            <div className="mb-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <Label className="mb-0">Events</Label>
                                                                    <Button color="outline-primary" size="sm" onClick={() => addHistoryEvent(historyIndex)}>
                                                                        <i className="ri-add-line align-bottom me-1"></i> Add Event
                                                                    </Button>
                                                                </div>

                                                                {item.events.map((event, eventIndex) => (
                                                                    <div key={eventIndex} className="d-flex align-items-center mb-2">
                                                                        <Input
                                                                            type="text"
                                                                            value={event}
                                                                            onChange={(e) => handleHistoryEventChange(historyIndex, eventIndex, e.target.value)}
                                                                            className="me-2"
                                                                        />
                                                                        <Button
                                                                            color="danger"
                                                                            size="sm"
                                                                            onClick={() => removeHistoryEvent(historyIndex, eventIndex)}
                                                                            disabled={item.events.length <= 1}
                                                                        >
                                                                            <i className="ri-delete-bin-line align-bottom"></i>
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </CardBody>
                                        </Card>
                                    </TabPane>

                                    {/* The Senate Tab */}
                                    <TabPane tabId="4">
                                        <Card>
                                            <CardHeader className="d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">University Senate Members</h5>
                                                <Button color="primary" size="sm" onClick={addSenateMember}>
                                                    <i className="ri-add-line align-bottom me-1"></i> Add Member
                                                </Button>
                                            </CardHeader>
                                            <CardBody>
                                                {senateMembers.map((member, index) => (
                                                    <Card key={index} className="mb-4">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h6 className="mb-0">Member #{index + 1}</h6>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeSenateMember(index)}
                                                                    disabled={senateMembers.length <= 1}
                                                                >
                                                                    <i className="ri-delete-bin-line align-bottom"></i>
                                                                </Button>
                                                            </div>

                                                            <Row>
                                                                <Col md={6}>
                                                                    <FormGroup>
                                                                        <Label for={`senate-name-${index}`}>Full Name</Label>
                                                                        <Input
                                                                            type="text"
                                                                            id={`senate-name-${index}`}
                                                                            value={member.name}
                                                                            onChange={(e) => handleSenateChange(index, 'name', e.target.value)}
                                                                        />
                                                                    </FormGroup>
                                                                </Col>
                                                                <Col md={6}>
                                                                    <FormGroup>
                                                                        <Label for={`senate-position-${index}`}>Position</Label>
                                                                        <Input
                                                                            type="text"
                                                                            id={`senate-position-${index}`}
                                                                            value={member.position}
                                                                            onChange={(e) => handleSenateChange(index, 'position', e.target.value)}
                                                                        />
                                                                    </FormGroup>
                                                                </Col>
                                                            </Row>

                                                            <FormGroup>
                                                                <Label for={`senate-image-${index}`}>Image URL</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`senate-image-${index}`}
                                                                    value={member.image}
                                                                    onChange={(e) => handleSenateChange(index, 'image', e.target.value)}
                                                                />
                                                                {member.image && (
                                                                    <div className="mt-2">
                                                                        <img
                                                                            src={member.image}
                                                                            alt="Preview"
                                                                            className="img-thumbnail"
                                                                            style={{ maxHeight: '150px' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`senate-message-${index}`}>Message/Quote</Label>
                                                                <Input
                                                                    type="textarea"
                                                                    id={`senate-message-${index}`}
                                                                    rows="2"
                                                                    value={member.message}
                                                                    onChange={(e) => handleSenateChange(index, 'message', e.target.value)}
                                                                />
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`senate-bio-${index}`}>Biography</Label>
                                                                <Input
                                                                    type="textarea"
                                                                    id={`senate-bio-${index}`}
                                                                    rows="4"
                                                                    value={member.bio}
                                                                    onChange={(e) => handleSenateChange(index, 'bio', e.target.value)}
                                                                />
                                                            </FormGroup>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </CardBody>
                                        </Card>
                                    </TabPane>

                                    {/* Accreditation Tab */}
                                    <TabPane tabId="5">
                                        <Card>
                                            <CardHeader className="d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">Accreditations & Certifications</h5>
                                                <Button color="primary" size="sm" onClick={addAccreditation}>
                                                    <i className="ri-add-line align-bottom me-1"></i> Add Accreditation
                                                </Button>
                                            </CardHeader>
                                            <CardBody>
                                                {accreditations.map((item, index) => (
                                                    <Card key={index} className="mb-4">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h6 className="mb-0">Accreditation #{index + 1}</h6>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeAccreditation(index)}
                                                                    disabled={accreditations.length <= 1}
                                                                >
                                                                    <i className="ri-delete-bin-line align-bottom"></i>
                                                                </Button>
                                                            </div>

                                                            <FormGroup>
                                                                <Label for={`accred-name-${index}`}>Accreditation Body Name</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`accred-name-${index}`}
                                                                    value={item.name}
                                                                    onChange={(e) => handleAccreditationChange(index, 'name', e.target.value)}
                                                                />
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`accred-logo-${index}`}>Logo URL</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`accred-logo-${index}`}
                                                                    value={item.logo}
                                                                    onChange={(e) => handleAccreditationChange(index, 'logo', e.target.value)}
                                                                />
                                                                {item.logo && (
                                                                    <div className="mt-2">
                                                                        <img
                                                                            src={item.logo}
                                                                            alt="Preview"
                                                                            className="img-thumbnail"
                                                                            style={{ maxHeight: '100px' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`accred-message-${index}`}>Description/Message</Label>
                                                                <Input
                                                                    type="textarea"
                                                                    id={`accred-message-${index}`}
                                                                    rows="3"
                                                                    value={item.message}
                                                                    onChange={(e) => handleAccreditationChange(index, 'message', e.target.value)}
                                                                />
                                                            </FormGroup>

                                                            <FormGroup>
                                                                <Label for={`accred-validity-${index}`}>Validity Period</Label>
                                                                <Input
                                                                    type="text"
                                                                    id={`accred-validity-${index}`}
                                                                    value={item.validity}
                                                                    onChange={(e) => handleAccreditationChange(index, 'validity', e.target.value)}
                                                                />
                                                            </FormGroup>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </CardBody>
                                        </Card>
                                    </TabPane>
                                </TabContent>
                            </div>
                        </Col>
                    </Row>

                    <div className="text-end mt-4 mb-4">
                        <Button color="success" type="submit" className="me-2">
                            <i className="ri-save-line align-bottom me-1"></i> Save Changes
                        </Button>
                        <Link to="/setting-profile" className="btn btn-secondary">
                            <i className="ri-close-line align-bottom me-1"></i> Cancel
                        </Link>
                    </div>
                </Form>
            </Container>
        </div>
    );
};

export default UniversityProfileEdit;