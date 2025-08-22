import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
    Card, CardBody, CardHeader, Col, Container,
    Nav, NavItem, NavLink, Row, TabContent,
    TabPane, Form, FormGroup, Label, Input,
    Button, Badge, Alert
} from 'reactstrap';
import classnames from 'classnames';
import { validateUniversityData } from '../utils/validation';
// Images
import profileBg from '../../../assets/images/simad-pic.jpeg';
import avatar1 from '../../../assets/images/logo-simad.png';

import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import Quill from 'quill';
import { useDispatch, useSelector } from 'react-redux';
import { getUniversityInfo as onGetUniversityInfo, updateUniversity as onUpdateUniversityInfo } from "../../../slices/thunks";
import { createSelector } from 'reselect';

// Import FilePond for file uploads
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Import Flatpickr for date selection
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const UniversityProfileEdit = () => {
    document.title = "Edit Profile | SIMAD University";
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const selectUniData = createSelector(
        (state) => state.Settings,
        (uniData) => uniData.uniData
    );

    const uniData = useSelector(selectUniData);
    const [universityInfo, setUniversityInfo] = useState({});
    const [whySimadData, setWhySimadData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [senateMembers, setSenateMembers] = useState([]);
    const [accreditations, setAccreditations] = useState([]);

    // FilePond states
    const [logoFiles, setLogoFiles] = useState([]);
    const [bgFiles, setBgFiles] = useState([]);
    const [whySimadImages, setWhySimadImages] = useState({});
    const [senateMemberImages, setSenateMemberImages] = useState({});
    const [accreditationLogos, setAccreditationLogos] = useState({});

    useEffect(() => {
        dispatch(onGetUniversityInfo());
    }, [dispatch]);

    useEffect(() => {
        if (uniData) {
            setUniversityInfo(uniData.university || {});
            setWhySimadData(uniData.whySimadItems || []);
            setHistoryData(uniData.historyItems || []);
            setSenateMembers(uniData.senateMembers || []);
            setAccreditations(uniData.accreditations || []);
        }
    }, [uniData]);

    const [activeTab, setActiveTab] = useState('1');
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    // Refs for Quill editors
    const missionRef = useRef(null);
    const visionRef = useRef(null);
    const historyRef = useRef(null);
    const achievementsRef = useRef(null);
    const guiding_principlesRef = useRef(null);

    // Quill instances
    const [missionQuill, setMissionQuill] = useState(null);
    const [visionQuill, setVisionQuill] = useState(null);
    const [historyQuill, setHistoryQuill] = useState(null);
    const [achievementsQuill, setAchievementsQuill] = useState(null);
    const [guidingPrinciplesQuill, setGuidingPrinciplesQuill] = useState(null);

    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    // Initialize Quill editors with content
    useEffect(() => {
        if (missionRef.current && !missionQuill && universityInfo.description) {
            const quill = new Quill(missionRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
            quill.root.innerHTML = universityInfo.description.mission || '';
            setMissionQuill(quill);
        }

        if (visionRef.current && !visionQuill && universityInfo.description) {
            const quill = new Quill(visionRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
            quill.root.innerHTML = universityInfo.description.vision || '';
            setVisionQuill(quill);
        }

        if (historyRef.current && !historyQuill && universityInfo.description) {
            const quill = new Quill(historyRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
            quill.root.innerHTML = universityInfo.description.history || '';
            setHistoryQuill(quill);
        }

        if (achievementsRef.current && !achievementsQuill && universityInfo.description) {
            const quill = new Quill(achievementsRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
            quill.root.innerHTML = universityInfo.description.core_values || '';
            setAchievementsQuill(quill);
        }

        if (guiding_principlesRef.current && !guidingPrinciplesQuill && universityInfo.description) {
            const quill = new Quill(guiding_principlesRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
            quill.root.innerHTML = universityInfo.description.guiding_principles || '';
            setGuidingPrinciplesQuill(quill);
        }
    }, [universityInfo, missionQuill, visionQuill, historyQuill, achievementsQuill, guidingPrinciplesQuill]);

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

    // Handle changes for why SIMAD items - FIXED: Create a new array instead of direct mutation
    const handleWhySimadChange = (index, field, value) => {
        setWhySimadData(prevData => {
            const updatedData = [...prevData];
            updatedData[index] = {
                ...updatedData[index],
                [field]: value
            };
            return updatedData;
        });
    };

    // Handle adding new why SIMAD item
    const addWhySimadItem = () => {
        setWhySimadData(prevData => [
            ...prevData,
            {
                id: `new-${Date.now()}`,
                title: "",
                description: "",
                image: "",
                order: prevData.length + 1,
                isActive: true
            }
        ]);
    };

    // Handle removing why SIMAD item
    const removeWhySimadItem = (index) => {
        if (whySimadData.length > 1) {
            setWhySimadData(prevData => {
                const updatedData = [...prevData];
                updatedData.splice(index, 1);
                return updatedData;
            });
        }
    };

    // Handle changes for history items - FIXED: Create a new array instead of direct mutation
    const handleHistoryChange = (index, field, value) => {
        setHistoryData(prevData => {
            const updatedData = [...prevData];
            updatedData[index] = {
                ...updatedData[index],
                [field]: value
            };
            return updatedData;
        });
    };

    // Handle changes for history events - FIXED: Create a new array instead of direct mutation
    const handleHistoryEventChange = (historyIndex, eventIndex, value) => {
        setHistoryData(prevData => {
            const updatedData = [...prevData];
            updatedData[historyIndex] = {
                ...updatedData[historyIndex],
                events: [...updatedData[historyIndex].events]
            };
            updatedData[historyIndex].events[eventIndex] = value;
            return updatedData;
        });
    };

    // Add new history item
    const addHistoryItem = () => {
        setHistoryData(prevData => [
            ...prevData,
            {
                id: `new-${Date.now()}`,
                year: "",
                events: [""],
                order: prevData.length + 1,
                isActive: true
            }
        ]);
    };

    // Add event to history item - FIXED: Create a new array instead of direct mutation
    const addHistoryEvent = (index) => {
        setHistoryData(prevData => {
            const updatedData = [...prevData];
            updatedData[index] = {
                ...updatedData[index],
                events: [...updatedData[index].events, ""]
            };
            return updatedData;
        });
    };

    // Remove history item - FIXED: Create a new array instead of direct mutation
    const removeHistoryItem = (index) => {
        if (historyData.length > 1) {
            setHistoryData(prevData => {
                const updatedData = [...prevData];
                updatedData.splice(index, 1);
                return updatedData;
            });
        }
    };

    // Remove event from history item - FIXED: Create a new array instead of direct mutation
    const removeHistoryEvent = (historyIndex, eventIndex) => {
        setHistoryData(prevData => {
            const updatedData = [...prevData];
            if (updatedData[historyIndex].events.length > 1) {
                updatedData[historyIndex] = {
                    ...updatedData[historyIndex],
                    events: updatedData[historyIndex].events.filter((_, i) => i !== eventIndex)
                };
            }
            return updatedData;
        });
    };

    // Handle changes for senate members - FIXED: Create a new array instead of direct mutation
    const handleSenateChange = (index, field, value) => {
        setSenateMembers(prevData => {
            const updatedData = [...prevData];
            updatedData[index] = {
                ...updatedData[index],
                [field]: value
            };
            return updatedData;
        });
    };

    // Add new senate member
    const addSenateMember = () => {
        setSenateMembers(prevData => [
            ...prevData,
            {
                id: `new-${Date.now()}`,
                name: "",
                position: "",
                image: "",
                message: "",
                bio: "",
                order: prevData.length + 1,
                isActive: true
            }
        ]);
    };

    // Remove senate member - FIXED: Create a new array instead of direct mutation
    const removeSenateMember = (index) => {
        if (senateMembers.length > 1) {
            setSenateMembers(prevData => {
                const updatedData = [...prevData];
                updatedData.splice(index, 1);
                return updatedData;
            });
        }
    };

    // Handle changes for accreditations - FIXED: Create a new array instead of direct mutation
    const handleAccreditationChange = (index, field, value) => {
        setAccreditations(prevData => {
            const updatedData = [...prevData];
            updatedData[index] = {
                ...updatedData[index],
                [field]: value
            };
            return updatedData;
        });
    };

    // Add new accreditation
    const addAccreditation = () => {
        setAccreditations(prevData => [
            ...prevData,
            {
                id: `new-${Date.now()}`,
                name: "",
                logo: "",
                message: "",
                validity: "",
                order: prevData.length + 1,
                isActive: true
            }
        ]);
    };

    // Remove accreditation - FIXED: Create a new array instead of direct mutation
    const removeAccreditation = (index) => {
        if (accreditations.length > 1) {
            setAccreditations(prevData => {
                const updatedData = [...prevData];
                updatedData.splice(index, 1);
                return updatedData;
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Get content from Quill editors
            const missionContent = missionQuill ? missionQuill.root.innerHTML : '';
            const visionContent = visionQuill ? visionQuill.root.innerHTML : '';
            const historyContent = historyQuill ? historyQuill.root.innerHTML : '';
            const achievementsContent = achievementsQuill ? achievementsQuill.root.innerHTML : '';
            const guidingPrinciplesContent = guidingPrinciplesQuill ? guidingPrinciplesQuill.root.innerHTML : '';

            // Update university info with editor content
            const updatedUniversityInfo = {
                ...universityInfo,
                description: {
                    ...universityInfo.description,
                    mission: missionContent,
                    vision: visionContent,
                    history: historyContent,
                    core_values: achievementsContent,
                    guiding_principles: guidingPrinciplesContent
                }
            };

            // Validate data before sending
            const validationErrors = validateUniversityData({
                universityInfo: updatedUniversityInfo,
                whySimadData,
                historyData,
                senateMembers,
                accreditations
            });

            if (validationErrors.length > 0) {
                setSaveStatus({
                    type: 'danger',
                    message: 'Please fix the following errors:',
                    errors: validationErrors
                });
                return;
            }

            setSaveStatus({ type: 'info', message: 'Saving changes...' });

            // Send all data in a single API call
            const data = {
                university: updatedUniversityInfo,
                whySimadItems: whySimadData,
                historyItems: historyData,
                senateMembers: senateMembers,
                accreditations: accreditations
            };
            try {
                const result = await dispatch(onUpdateUniversityInfo(data)).unwrap();
                // result here is your payload from the API
                if (!result.success) {
                    if (result.errors?.length) {
                        throw new Error(result.errors.join(', '));
                    }
                    throw new Error(result.message || 'Failed to save changes');
                }
            } catch (err) {
                console.error(err.message);
            }


            setSaveStatus({ type: 'success', message: 'All changes saved successfully!' });

            // Redirect after a short delay
            setTimeout(() => {
                navigate("/setting-profile");
            }, 2000);

        } catch (error) {
            setSaveStatus({
                type: 'danger',
                message: error.message || 'Error saving changes. Please try again.'
            });
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
                        <Col xs="auto">
                            <div className="avatar-lg">
                                <img src={avatar1} alt="user-img" className="img-thumbnail rounded-circle" />
                            </div>
                        </Col>

                        <Col>
                            <div className="p-2">
                                <h3 className="text-white mb-1">Edit University Profile</h3>
                                <p className="text-white text-opacity-75">Update and manage all university information</p>
                            </div>
                        </Col>

                        <Col xs={12} lg="auto" className="order-last order-lg-0">
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
                        {saveStatus.errors && (
                            <ul className="mb-0 mt-2">
                                {saveStatus.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        )}
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
                                                        <Row>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="name">University Name</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="name"
                                                                        value={universityInfo.name || ''}
                                                                        onChange={(e) => handleInputChange(e, null, 'name')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="type">University Type</Label>
                                                                    <Input
                                                                        type="select"
                                                                        id="type"
                                                                        value={universityInfo.type || ''}
                                                                        onChange={(e) => handleInputChange(e, null, 'type')}
                                                                    >
                                                                        <option value="Private">Private</option>
                                                                        <option value="Public">Public</option>
                                                                    </Input>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>

                                                        <FormGroup>
                                                            <Label for="motto">Motto</Label>
                                                            <Input
                                                                type="text"
                                                                id="motto"
                                                                value={universityInfo.motto || ''}
                                                                onChange={(e) => handleInputChange(e, null, 'motto')}
                                                            />
                                                        </FormGroup>

                                                        <Row>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="founded">Founded Date</Label>
                                                                    <Flatpickr
                                                                        className="form-control"
                                                                        value={universityInfo.founded || ''}
                                                                        onChange={([date]) => {
                                                                            setUniversityInfo(prev => ({
                                                                                ...prev,
                                                                                founded: date ? new Date(date).toISOString() : ''
                                                                            }));
                                                                        }}
                                                                        options={{
                                                                            altInput: true,
                                                                            altFormat: "F j, Y",
                                                                            dateFormat: "Y-m-d",
                                                                        }}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="colors">Colors (comma separated)</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="colors"
                                                                        value={Array.isArray(universityInfo.colors) ? universityInfo.colors.join(', ') : universityInfo.colors || ''}
                                                                        onChange={(e) => handleInputChange(e, null, 'colors', e.target.value.split(',').map(item => item.trim()))}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>

                                                        <FormGroup>
                                                            <Label for="formerNames">Former Names (comma separated)</Label>
                                                            <Input
                                                                type="text"
                                                                id="formerNames"
                                                                value={Array.isArray(universityInfo.formerNames) ? universityInfo.formerNames.join(', ') : universityInfo.formerNames || ''}
                                                                onChange={(e) => handleInputChange(e, null, 'formerNames', e.target.value.split(',').map(item => item.trim()))}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="otherNames">Other Names (comma separated)</Label>
                                                            <Input
                                                                type="text"
                                                                id="otherNames"
                                                                value={Array.isArray(universityInfo.otherNames) ? universityInfo.otherNames.join(', ') : universityInfo.otherNames || ''}
                                                                onChange={(e) => handleInputChange(e, null, 'otherNames', e.target.value.split(',').map(item => item.trim()))}
                                                            />
                                                        </FormGroup>
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="card-title mb-0">Statistics</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <Row>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="students">Number of Students</Label>
                                                                    <Input
                                                                        type="number"
                                                                        id="students"
                                                                        value={universityInfo.stats?.students || ''}
                                                                        onChange={(e) => handleInputChange(e, 'stats', 'students')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="alumni">Number of Alumni</Label>
                                                                    <Input
                                                                        type="number"
                                                                        id="alumni"
                                                                        value={universityInfo.stats?.alumni || ''}
                                                                        onChange={(e) => handleInputChange(e, 'stats', 'alumni')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <FormGroup>
                                                            <Label for="faculties">Number of Faculties</Label>
                                                            <Input
                                                                type="number"
                                                                id="faculties"
                                                                value={universityInfo.stats?.faculties || ''}
                                                                onChange={(e) => handleInputChange(e, 'stats', 'faculties')}
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
                                                                value={universityInfo.address?.street || ''}
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
                                                                        value={universityInfo.address?.city || ''}
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
                                                                        value={universityInfo.address?.state || ''}
                                                                        onChange={(e) => handleInputChange(e, 'address', 'state')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="country">Country</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="country"
                                                                        value={universityInfo.address?.country || ''}
                                                                        onChange={(e) => handleInputChange(e, 'address', 'country')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for="phone">Phone Number</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="phone"
                                                                        value={universityInfo.contact?.phone || ''}
                                                                        onChange={(e) => handleInputChange(e, 'contact', 'phone')}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <FormGroup>
                                                            <Label for="email">Email Address</Label>
                                                            <Input
                                                                type="email"
                                                                id="email"
                                                                value={universityInfo.contact?.email || ''}
                                                                onChange={(e) => handleInputChange(e, 'contact', 'email')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="website">Website</Label>
                                                            <Input
                                                                type="url"
                                                                id="website"
                                                                value={universityInfo.contact?.website || ''}
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
                                                                value={universityInfo.academics?.language || ''}
                                                                onChange={(e) => handleInputChange(e, 'academics', 'language')}
                                                            />
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="affiliation">Affiliation</Label>
                                                            <Input
                                                                type="text"
                                                                id="affiliation"
                                                                value={universityInfo.academics?.affiliation || ''}
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
                                                            <div className="snow-editor" style={{ height: 300 }}>
                                                                <div ref={missionRef} />
                                                            </div>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="vision">Vision Statement</Label>
                                                            <div className="snow-editor" style={{ height: 300, marginBottom: '20px' }}>
                                                                <div ref={visionRef} />
                                                            </div>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="history">History</Label>
                                                            <div className="snow-editor" style={{ height: 300, marginBottom: '20px' }}>
                                                                <div ref={historyRef} />
                                                            </div>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="guiding_principles">Guiding Principles</Label>
                                                            <div className="snow-editor" style={{ height: 300, marginBottom: '20px' }}>
                                                                <div ref={guiding_principlesRef} />
                                                            </div>
                                                        </FormGroup>

                                                        <FormGroup>
                                                            <Label for="achievements">Achievements & Core Values</Label>
                                                            <div className="snow-editor" style={{ height: 300, marginBottom: '20px' }}>
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
                                                <Row>
                                                    {whySimadData.map((item, index) => (
                                                        <Col lg={6} key={item.id || index} className="mb-4">
                                                            <Card>
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
                                                                            value={item.title || ''}
                                                                            onChange={(e) => handleWhySimadChange(index, 'title', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`why-desc-${index}`}>Description</Label>
                                                                        <Input
                                                                            type="textarea"
                                                                            id={`why-desc-${index}`}
                                                                            rows="3"
                                                                            value={item.description || ''}
                                                                            onChange={(e) => handleWhySimadChange(index, 'description', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`why-image-${index}`}>Upload Image</Label>
                                                                        <FilePond
                                                                            files={whySimadImages[index] || []}
                                                                            onupdatefiles={(fileItems) => {
                                                                                const newImages = { ...whySimadImages };
                                                                                newImages[index] = fileItems;
                                                                                setWhySimadImages(newImages);

                                                                                if (fileItems.length > 0) {
                                                                                    handleWhySimadChange(index, 'image', fileItems[0].file.name);
                                                                                }
                                                                            }}
                                                                            allowMultiple={false}
                                                                            name="image"
                                                                            labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                                                                        />
                                                                        {item.image && (
                                                                            <div className="mt-2">
                                                                                <small className="text-muted">Current image: {item.image}</small>
                                                                                <div className="mt-1">
                                                                                    <img
                                                                                        src={require(`../../../assets/images/${item.image}`)}
                                                                                        alt="Current"
                                                                                        className="img-thumbnail"
                                                                                        style={{ maxHeight: '100px' }}
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </FormGroup>

                                                                    <FormGroup >
                                                                        <Label for={`why-order-${index}`}>Display Order</Label>
                                                                        <Input
                                                                            type="number"
                                                                            id={`why-order-${index}`}
                                                                            value={item.order || index + 1}
                                                                            onChange={(e) => handleWhySimadChange(index, 'order', parseInt(e.target.value))}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            id={`why-active-${index}`}
                                                                            checked={item.isActive !== false}
                                                                            onChange={(e) => handleWhySimadChange(index, 'isActive', e.target.checked)}
                                                                        />
                                                                        <Label for={`why-active-${index}`} check>Active</Label>
                                                                    </FormGroup>
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
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
                                                <Row>
                                                    {historyData.map((item, historyIndex) => (
                                                        <Col lg={6} key={item.id || historyIndex} className="mb-4">
                                                            <Card>
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
                                                                            value={item.year || ''}
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

                                                                        {item.events && item.events.map((event, eventIndex) => (
                                                                            <div key={eventIndex} className="d-flex align-items-center mb-2">
                                                                                <Input
                                                                                    type="text"
                                                                                    value={event || ''}
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

                                                                    <FormGroup style={{ display: "none" }}>
                                                                        <Label for={`history-order-${historyIndex}`}>Display Order</Label>
                                                                        <Input
                                                                            type="number"
                                                                            id={`history-order-${historyIndex}`}
                                                                            value={item.order || historyIndex + 1}
                                                                            onChange={(e) => handleHistoryChange(historyIndex, 'order', parseInt(e.target.value))}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            id={`history-active-${historyIndex}`}
                                                                            checked={item.isActive !== false}
                                                                            onChange={(e) => handleHistoryChange(historyIndex, 'isActive', e.target.checked)}
                                                                        />
                                                                        <Label for={`history-active-${historyIndex}`} check>Active</Label>
                                                                    </FormGroup>
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
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
                                                <Row>
                                                    {senateMembers.map((member, index) => (
                                                        <Col lg={6} key={member.id || index} className="mb-4">
                                                            <Card>
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
                                                                                    value={member.name || ''}
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
                                                                                    value={member.position || ''}
                                                                                    onChange={(e) => handleSenateChange(index, 'position', e.target.value)}
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>

                                                                    <FormGroup>
                                                                        <Label for={`senate-image-${index}`}>Upload Image</Label>
                                                                        <FilePond
                                                                            files={senateMemberImages[index] || []}
                                                                            onupdatefiles={(fileItems) => {
                                                                                const newImages = { ...senateMemberImages };
                                                                                newImages[index] = fileItems;
                                                                                setSenateMemberImages(newImages);

                                                                                if (fileItems.length > 0) {
                                                                                    handleSenateChange(index, 'image', fileItems[0].file.name);
                                                                                }
                                                                            }}
                                                                            allowMultiple={false}
                                                                            name="image"
                                                                            labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                                                                        />
                                                                        {member.image && (
                                                                            <div className="mt-2">
                                                                                <small className="text-muted">Current image: {member.image}</small>
                                                                                <div className="mt-1">
                                                                                    <img
                                                                                        src={require(`../../../assets/images/${member.image}`)}
                                                                                        alt="Current"
                                                                                        className="img-thumbnail"
                                                                                        style={{ maxHeight: '100px' }}
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`senate-message-${index}`}>Message/Quote</Label>
                                                                        <Input
                                                                            type="textarea"
                                                                            id={`senate-message-${index}`}
                                                                            rows="2"
                                                                            value={member.message || ''}
                                                                            onChange={(e) => handleSenateChange(index, 'message', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`senate-bio-${index}`}>Biography</Label>
                                                                        <Input
                                                                            type="textarea"
                                                                            id={`senate-bio-${index}`}
                                                                            rows="4"
                                                                            value={member.bio || ''}
                                                                            onChange={(e) => handleSenateChange(index, 'bio', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`senate-order-${index}`}>Display Order</Label>
                                                                        <Input
                                                                            type="number"
                                                                            id={`senate-order-${index}`}
                                                                            value={member.order || index + 1}
                                                                            onChange={(e) => handleSenateChange(index, 'order', parseInt(e.target.value))}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            id={`senate-active-${index}`}
                                                                            checked={member.isActive !== false}
                                                                            onChange={(e) => handleSenateChange(index, 'isActive', e.target.checked)}
                                                                        />
                                                                        <Label for={`senate-active-${index}`} check>Active</Label>
                                                                    </FormGroup>
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
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
                                                <Row>
                                                    {accreditations.map((item, index) => (
                                                        <Col lg={6} key={item.id || index} className="mb-4">
                                                            <Card>
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
                                                                            value={item.name || ''}
                                                                            onChange={(e) => handleAccreditationChange(index, 'name', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`accred-logo-${index}`}>Upload Logo</Label>
                                                                        <FilePond
                                                                            files={accreditationLogos[index] || []}
                                                                            onupdatefiles={(fileItems) => {
                                                                                const newLogos = { ...accreditationLogos };
                                                                                newLogos[index] = fileItems;
                                                                                setAccreditationLogos(newLogos);

                                                                                if (fileItems.length > 0) {
                                                                                    handleAccreditationChange(index, 'logo', fileItems[0].file.name);
                                                                                }
                                                                            }}
                                                                            allowMultiple={false}
                                                                            name="logo"
                                                                            labelIdle='Drag & Drop your logo or <span class="filepond--label-action">Browse</span>'
                                                                        />
                                                                        {item.logo && (
                                                                            <div className="mt-2">
                                                                                <small className="text-muted">Current logo: {item.logo}</small>
                                                                                <div className="mt-1">
                                                                                    <img
                                                                                        src={require(`../../../assets/images/${item.logo}`)}
                                                                                        alt="Current"
                                                                                        className="img-thumbnail"
                                                                                        style={{ maxHeight: '100px' }}
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`accred-message-${index}`}>Description/Message</Label>
                                                                        <Input
                                                                            type="textarea"
                                                                            id={`accred-message-${index}`}
                                                                            rows="3"
                                                                            value={item.message || ''}
                                                                            onChange={(e) => handleAccreditationChange(index, 'message', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`accred-validity-${index}`}>Validity Period</Label>
                                                                        <Input
                                                                            type="text"
                                                                            id={`accred-validity-${index}`}
                                                                            value={item.validity || ''}
                                                                            onChange={(e) => handleAccreditationChange(index, 'validity', e.target.value)}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <Label for={`accred-order-${index}`}>Display Order</Label>
                                                                        <Input
                                                                            type="number"
                                                                            id={`accred-order-${index}`}
                                                                            value={item.order || index + 1}
                                                                            onChange={(e) => handleAccreditationChange(index, 'order', parseInt(e.target.value))}
                                                                        />
                                                                    </FormGroup>

                                                                    <FormGroup check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            id={`accred-active-${index}`}
                                                                            checked={item.isActive !== false}
                                                                            onChange={(e) => handleAccreditationChange(index, 'isActive', e.target.checked)}
                                                                        />
                                                                        <Label for={`accred-active-${index}`} check>Active</Label>
                                                                    </FormGroup>
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
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