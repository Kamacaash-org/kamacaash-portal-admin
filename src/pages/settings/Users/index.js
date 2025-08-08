import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Form, Input, Label, Modal, ModalBody, Offcanvas, OffcanvasBody, Row, UncontrolledDropdown, FormFeedback } from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import DeleteModal from "../../../Components/Common/DeleteModal";
import { ToastContainer } from 'react-toastify';

//User Images
import avatar2 from '../../../assets/images/users/avatar-2.jpg';
import bg_users from "../../../assets/images/users/simad-users-bg.webp"
import userdummyimg from '../../../assets/images/users/user-dummy-img.jpg';
// import imgUrl from "../../../assets/images/users";
//Small Images
import smallImage9 from '../../../assets/images/simad-pic.jpeg';
//redux
import { useSelector, useDispatch } from 'react-redux';

//import action
import {
    getUsersData as onGetUsersData,
    adduser as onAddNewUser,
    updateUser as onUpdateUser,
    deleteUser as onDeleteUser,
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";
import { createSelector } from 'reselect';

const Users = () => {
    document.title = "users | simad University";

    const dispatch = useDispatch();

    const selectusersData = createSelector(
        (state) => state.Settings,
        (usersData) => usersData.usersData
    );
    // Inside your component
    const usersData = useSelector(selectusersData);


    const [users, setUsers] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [usersList, setUsersList] = useState([]);

    //Modal  
    const [user, setUser] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [modal, setModal] = useState(false);

    useEffect(() => {
        dispatch(onGetUsersData());
    }, [dispatch]);

    useEffect(() => {
        // setUsers(usersData?.data?.users);
        setUsersList(usersData?.data?.users);
    }, [usersData]);


    // console.log("selectedData is ", usersData)

    const toggle = useCallback(() => {
        if (modal) {
            setModal(false);
            setUser(null);
        } else {
            setModal(true);
        }
    }, [modal]);

    const handleUserClick = useCallback((userData) => {
        setUser({
            id: userData._id,
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            title: userData.title,
            avatar: userData.avatar,
            bg_url: userData.bg_url,
            isActive: userData.isActive
        });
        setIsEdit(true);
        toggle();
    }, [toggle]);

    // Add User
    const handleUserAddClick = () => {
        setUser(null);
        setModal(!modal);
        setIsEdit(false);
        toggle();
    };

    // Delete User
    const onClickDelete = (user) => {
        setUser(user);
        setDeleteModal(true);
    };

    const handleDeleteUser = () => {
        if (user) {
            dispatch(onDeleteUser(user));
            setDeleteModal(false);
        }
    };

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            username: (user && user.username) || '',
            email: (user && user.email) || '',
            password: '',
            firstName: (user && user.firstName) || '',
            lastName: (user && user.lastName) || '',
            phone: (user && user.phone) || '',
            title: (user && user.title) || '',
            isActive: (user && user.isActive) || true
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .required("Username is required")
                .trim()
                .lowercase(),
            email: Yup.string()
                .email("Invalid email format")
                .required("Email is required")
                .trim()
                .lowercase(),
            password: Yup.string()
                .when('isEdit', (isEdit, schema) => {
                    return isEdit ? schema.notRequired() : schema.min(8, "Password must be at least 8 characters").required("Password is required")
                }),
            firstName: Yup.string().required("First name is required").trim(),
            lastName: Yup.string().required("Last name is required").trim(),
            phone: Yup.string().trim(),
            title: Yup.string().trim(),
            isActive: Yup.boolean()
        }),
        onSubmit: (values) => {
            if (isEdit) {
                const updateUserData = {
                    id: user ? user.id : 0,
                    ...values,
                    // Don't update password if not changed
                    password: values.password || undefined
                };
                dispatch(onUpdateUser(updateUserData));
            } else {
                const newUserData = {
                    id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
                    ...values,
                    avatar: 'user-dummy-img.jpg',
                    bg_url: 'user-dummy-img.jpg'
                };
                dispatch(onAddNewUser(newUserData));
            }
            validation.resetForm();
            toggle();
        },
    });

    useEffect(() => {
        const list = document.querySelectorAll(".team-list");
        const buttonGroups = document.querySelectorAll('.filter-button');
        for (let i = 0; i < buttonGroups.length; i++) {
            buttonGroups[i].addEventListener('click', onButtonGroupClick);
        }

        function onButtonGroupClick(event) {
            if (event.target.id === 'list-view-button' || event.target.parentElement.id === 'list-view-button') {
                document.getElementById("list-view-button").classList.add("active");
                document.getElementById("grid-view-button").classList.remove("active");
                list.forEach(function (el) {
                    el.classList.add("list-view-filter");
                    el.classList.remove("grid-view-filter");
                });

            } else {
                document.getElementById("grid-view-button").classList.add("active");
                document.getElementById("list-view-button").classList.remove("active");
                list.forEach(function (el) {
                    el.classList.remove("list-view-filter");
                    el.classList.add("grid-view-filter");
                });
            }
        }
    }, []);

    const favouriteBtn = (ele) => {
        if (ele.closest("button").classList.contains("active")) {
            ele.closest("button").classList.remove("active");
        } else {
            ele.closest("button").classList.add("active");
        }
    };

    const searchList = (e) => {
        let inputVal = e.toLowerCase();

        const filterItems = (arr, query) => {
            const lowerQuery = query.toLowerCase();

            return arr.filter((el) => {
                return (
                    (el.username && el.username.toLowerCase().includes(lowerQuery)) ||
                    (el.phone && el.phone.toLowerCase().includes(lowerQuery)) ||
                    (el.firstName && el.firstName.toLowerCase().includes(lowerQuery)) ||
                    (el.lastName && el.lastName.toLowerCase().includes(lowerQuery)) ||
                    (el.title && el.title.toLowerCase().includes(lowerQuery))
                );
            });
        };


        let filterData = filterItems(usersData?.data?.users, inputVal);
        setUsersList(filterData);
        if (filterData.length === 0) {
            document.getElementById("noresult").style.display = "block";
            document.getElementById("teamlist").style.display = "none";
        } else {
            document.getElementById("noresult").style.display = "none";
            document.getElementById("teamlist").style.display = "block";
        }
    };

    //OffCanvas  
    const [isOpen, setIsOpen] = useState(false);
    const [sideBar, setSideBar] = useState([]);

    //Dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggledropDown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <React.Fragment>
            <ToastContainer closeButton={false} />
            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => handleDeleteUser()}
                onCloseClick={() => setDeleteModal(false)}
            />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Users" pageTitle="Pages" />
                    <Card>
                        <CardBody>
                            <Row className="g-2">
                                <Col sm={4}>
                                    <div className="search-box">
                                        <Input type="text" className="form-control" placeholder="Search for name or phone or title..." onChange={(e) => searchList(e.target.value)} />
                                        <i className="ri-search-line search-icon"></i>
                                    </div>
                                </Col>
                                <Col className="col-sm-auto ms-auto">
                                    <div className="list-grid-nav hstack gap-1">

                                        <Button color="info" id="grid-view-button" className="btn btn-soft-info nav-link btn-icon fs-14 active filter-button material-shadow-none"><i className="ri-grid-fill"></i></Button>
                                        <Button color="info" id="list-view-button" className="btn btn-soft-info nav-link  btn-icon fs-14 filter-button material-shadow-none"><i className="ri-list-unordered"></i></Button>
                                        {/* <Dropdown
                                            isOpen={dropdownOpen}
                                            toggle={toggledropDown}>
                                            <DropdownToggle type="button" className="btn btn-soft-info btn-icon fs-14 material-shadow-none">
                                                <i className="ri-more-2-fill"></i>
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <li><Link className="dropdown-item" to="#">All</Link></li>
                                                <li><Link className="dropdown-item" to="#">Last Week</Link></li>
                                                <li><Link className="dropdown-item" to="#">Last Month</Link></li>
                                                <li><Link className="dropdown-item" to="#">Last Year</Link></li>
                                            </DropdownMenu>
                                        </Dropdown> */}
                                        <Button color="success" onClick={() => handleUserAddClick()}>
                                            <i className="ri-add-fill me-1 align-bottom"></i> Add Members</Button>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Row>
                        <Col lg={12}>
                            <div id="teamlist">
                                <Row className="team-list grid-view-filter">
                                    {(usersList || []).map((item, key) => (
                                        <Col key={key}>
                                            <Card className="team-box">
                                                <div className="team-cover">
                                                    <img src={smallImage9} alt="" className="img-fluid" />
                                                </div>
                                                <CardBody className="p-4">
                                                    <Row className="align-items-center team-row">
                                                        <Col className="team-settings">
                                                            <Row>
                                                                <Col>
                                                                    <div className="flex-shrink-0 me-2">
                                                                        {/* <button type="button" className="btn btn-light btn-icon rounded-circle btn-sm favourite-btn" onClick={(e) => favouriteBtn(e.target)}>
                                                                            <i className="ri-star-fill fs-14"></i>
                                                                        </button> */}
                                                                    </div>
                                                                </Col>
                                                                <UncontrolledDropdown direction='start' className="col text-end">
                                                                    <DropdownToggle tag="a" id="dropdownMenuLink2" role="button">
                                                                        <i className="ri-more-fill fs-17"></i>
                                                                    </DropdownToggle>
                                                                    <DropdownMenu>
                                                                        <DropdownItem className="dropdown-item edit-list" href="#addmemberModal" onClick={() => handleUserClick(item)}>
                                                                            <i className="ri-pencil-line me-2 align-bottom text-muted"></i>Edit
                                                                        </DropdownItem>
                                                                        <DropdownItem className="dropdown-item remove-list" href="#removeMemberModal" onClick={() => onClickDelete(item)}>
                                                                            <i className="ri-delete-bin-5-line me-2 align-bottom text-muted"></i>Remove
                                                                        </DropdownItem>
                                                                    </DropdownMenu>
                                                                </UncontrolledDropdown>
                                                            </Row>
                                                        </Col>
                                                        <Col lg={4} className="col">
                                                            <div className="team-profile-img">

                                                                <div className="avatar-lg img-thumbnail rounded-circle flex-shrink-0">
                                                                    {item.avatar != null ?
                                                                        <img src={require(`../../../assets/images/users/${item.avatar}`)} alt="" className="img-fluid d-block rounded-circle" />

                                                                        :
                                                                        <div className="avatar-title text-uppercase border rounded-circle bg-light text-primary">
                                                                            {item.firstName.charAt(0) + item.lastName.split(" ").slice(-1).toString().charAt(0)}
                                                                        </div>}
                                                                </div>
                                                                <div className="team-content">
                                                                    <Link to="#" onClick={() => { setIsOpen(!isOpen); setSideBar(item); }}><h5 className="fs-16 mb-1">{item.username}</h5></Link>
                                                                    <p className="text-muted mb-0">{item.title || "Team Member"}</p>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col lg={4} className="col">
                                                            <Row className="text-muted text-center">
                                                                <Col xs={6} className="border-end border-end-dashed">
                                                                    <h5 className="mb-1">{item.no_of_posts || 0}</h5>
                                                                    <p className="text-muted mb-0">Posts</p>
                                                                </Col>
                                                                <Col xs={6}>
                                                                    <h5 className="mb-1">{item.no_of_followers || 0}</h5>
                                                                    <p className="text-muted mb-0">Followers</p>
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                        <Col lg={2} className="col">
                                                            <div className="text-end">
                                                                <Link to="#" onClick={() => { setIsOpen(!isOpen); setSideBar(item); }} className="btn btn-light view-btn">View Profile</Link>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    ))}

                                    {/* <Col lg={12}>
                                        <div className="text-center mb-3">
                                            <Link to="#" className="text-success"><i className="mdi mdi-loading mdi-spin fs-20 align-middle me-2"></i> Load More </Link>
                                        </div>
                                    </Col> */}
                                </Row>

                                <div className="modal fade" id="addmembers" tabIndex="-1" aria-hidden="true">
                                    <div className="modal-dialog modal-dialog-centered">
                                        <Modal isOpen={modal} toggle={toggle} centered size='lg'>
                                            <ModalBody>
                                                <Form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                    return false;
                                                }}>
                                                    <Row>
                                                        <Col lg={12}>
                                                            <div className="px-1 pt-1">
                                                                <div className="modal-team-cover position-relative mb-0 mt-n4 mx-n4 rounded-top overflow-hidden">
                                                                    <img src={smallImage9} alt="" className="img-fluid" />
                                                                    <div className="d-flex position-absolute start-0 end-0 top-0 p-3">
                                                                        <div className="flex-grow-1">
                                                                            <h5 className="modal-title text-white">
                                                                                {!isEdit ? "Add New User" : "Edit User"}
                                                                            </h5>
                                                                        </div>
                                                                        <div className="flex-shrink-0">
                                                                            <button type="button" className="btn-close btn-close-white" onClick={toggle} aria-label="Close"></button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-center mb-4 mt-n5 pt-2">
                                                                <div className="position-relative d-inline-block">
                                                                    <div className="avatar-lg">
                                                                        <div className="avatar-title bg-light rounded-circle">
                                                                            <img src={userdummyimg} alt="user" className="avatar-md rounded-circle h-auto" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row">
                                                                <div className="col-md-6 mb-3">
                                                                    <Label htmlFor="firstName" className="form-label">First Name</Label>
                                                                    <Input
                                                                        type="text"
                                                                        className="form-control"
                                                                        id="firstName"
                                                                        placeholder="Enter first name"
                                                                        name="firstName"
                                                                        onChange={validation.handleChange}
                                                                        onBlur={validation.handleBlur}
                                                                        value={validation.values.firstName}
                                                                        invalid={validation.touched.firstName && !!validation.errors.firstName}
                                                                    />
                                                                    <FormFeedback>{validation.errors.firstName}</FormFeedback>
                                                                </div>
                                                                <div className="col-md-6 mb-3">
                                                                    <Label htmlFor="lastName" className="form-label">Last Name</Label>
                                                                    <Input
                                                                        type="text"
                                                                        className="form-control"
                                                                        id="lastName"
                                                                        placeholder="Enter last name"
                                                                        name="lastName"
                                                                        onChange={validation.handleChange}
                                                                        onBlur={validation.handleBlur}
                                                                        value={validation.values.lastName}
                                                                        invalid={validation.touched.lastName && !!validation.errors.lastName}
                                                                    />
                                                                    <FormFeedback>{validation.errors.lastName}</FormFeedback>
                                                                </div>
                                                            </div>
                                                            <Row>
                                                                <Col md={4}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="username" className="form-label">Username</Label>
                                                                        <Input
                                                                            type="text"
                                                                            className="form-control"
                                                                            id="username"
                                                                            placeholder="Enter username"
                                                                            name="username"
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.username}
                                                                            invalid={validation.touched.username && !!validation.errors.username}
                                                                        />
                                                                        <FormFeedback>{validation.errors.username}</FormFeedback>
                                                                    </div>

                                                                </Col>
                                                                <Col md={4}>

                                                                    <div className="mb-3">
                                                                        <Label htmlFor="email" className="form-label">Email</Label>
                                                                        <Input
                                                                            type="email"
                                                                            className="form-control"
                                                                            id="email"
                                                                            placeholder="Enter email"
                                                                            name="email"
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.email}
                                                                            invalid={validation.touched.email && !!validation.errors.email}
                                                                        />
                                                                        <FormFeedback>{validation.errors.email}</FormFeedback>
                                                                    </div>
                                                                </Col>

                                                                <Col md={4}>

                                                                    {!isEdit && (
                                                                        <div className="mb-3">
                                                                            <Label htmlFor="password" className="form-label">Password</Label>
                                                                            <Input
                                                                                type="password"
                                                                                className="form-control"
                                                                                id="password"
                                                                                placeholder="Enter password"
                                                                                name="password"
                                                                                onChange={validation.handleChange}
                                                                                onBlur={validation.handleBlur}
                                                                                value={validation.values.password}
                                                                                invalid={validation.touched.password && !!validation.errors.password}
                                                                            />
                                                                            <FormFeedback>{validation.errors.password}</FormFeedback>
                                                                        </div>
                                                                    )}
                                                                </Col>

                                                            </Row>

                                                            <Row>
                                                                <Col md={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="phone" className="form-label">Phone</Label>
                                                                        <Input
                                                                            type="text"
                                                                            className="form-control"
                                                                            id="phone"
                                                                            placeholder="Enter phone number"
                                                                            name="phone"
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.phone}
                                                                            invalid={validation.touched.phone && !!validation.errors.phone}
                                                                        />
                                                                        <FormFeedback>{validation.errors.phone}</FormFeedback>
                                                                    </div>
                                                                </Col>
                                                                <Col md={6}>

                                                                    <div className="mb-3">
                                                                        <Label htmlFor="title" className="form-label">Title</Label>
                                                                        <Input
                                                                            type="text"
                                                                            className="form-control"
                                                                            id="title"
                                                                            placeholder="Enter title"
                                                                            name="title"
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.title}
                                                                            invalid={validation.touched.title && !!validation.errors.title}
                                                                        />
                                                                        <FormFeedback>{validation.errors.title}</FormFeedback>
                                                                    </div>
                                                                </Col>
                                                            </Row>

                                                            <div className="mb-3 form-check" style={{ display: "none" }}>
                                                                <Input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id="isActive"
                                                                    name="isActive"
                                                                    onChange={validation.handleChange}
                                                                    checked={validation.values.isActive}
                                                                />
                                                                <Label htmlFor="isActive" className="form-check-label">Active User</Label>
                                                            </div>



                                                            <div className="hstack gap-2 justify-content-end">
                                                                <button type="button" className="btn btn-light" onClick={toggle}>Close</button>
                                                                <button type="submit" className="btn btn-success">
                                                                    {!isEdit ? "Add User" : "Save Changes"}
                                                                </button>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Form>
                                            </ModalBody>
                                        </Modal>
                                    </div>
                                </div>

                                <Offcanvas
                                    isOpen={isOpen}
                                    direction="end"
                                    toggle={() => setIsOpen(!isOpen)}
                                    className="offcanvas-end border-0"
                                    tabIndex="-1"
                                    id="member-overview"
                                >
                                    <OffcanvasBody className="profile-offcanvas p-0">
                                        <div className="team-cover">
                                            <img src={smallImage9 || smallImage9} alt="" className="img-fluid" />
                                        </div>
                                        <div className="p-3">
                                            <div className="team-settings">
                                                <Row>

                                                </Row>
                                            </div>
                                        </div>
                                        <div className="p-3 text-center">
                                            {sideBar.avatar != null ?
                                                <img src={require(`../../../assets/images/users/${sideBar.avatar}`)} alt="" className="avatar-lg img-thumbnail rounded-circle mx-auto" />

                                                :
                                                <div className="avatar-title text-uppercase border rounded-circle bg-light text-primary">
                                                    {/* {sideBar.firstName.charAt(0) + sideBar.lastName.split(" ").slice(-1).toString().charAt(0)} */}
                                                </div>}


                                            <div className="mt-3">
                                                <h5 className="fs-15 profile-name"><Link to="#" className="link-primary">{sideBar.firstName + " " + sideBar.lastName || "N/A"}</Link></h5>
                                                <p className="text-muted profile-designation">{sideBar.title || "Team Member"}</p>
                                            </div>
                                            {/* <div className="hstack gap-2 justify-content-center mt-4">
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-secondary-subtle text-secondary rounded fs-16">
                                                        <i className="ri-facebook-fill"></i>
                                                    </Link>
                                                </div>
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-success-subtle text-success rounded fs-16">
                                                        <i className="ri-slack-fill"></i>
                                                    </Link>
                                                </div>
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-info-subtle text-info rounded fs-16">
                                                        <i className="ri-linkedin-fill"></i>
                                                    </Link>
                                                </div>
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-danger-subtle text-danger rounded fs-16">
                                                        <i className="ri-dribbble-fill"></i>
                                                    </Link>
                                                </div>
                                            </div> */}
                                        </div>
                                        <Row className="g-0 text-center">
                                            <Col xs={6}>
                                                <div className="p-3 border border-dashed border-start-0">
                                                    <h5 className="mb-1 profile-project">{sideBar.projectCount || "124"}</h5>
                                                    <p className="text-muted mb-0">Posts</p>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="p-3 border border-dashed border-start-0">
                                                    <h5 className="mb-1 profile-task">{sideBar.taskCount || "81"}</h5>
                                                    <p className="text-muted mb-0">Followers</p>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="p-3">
                                            <h5 className="fs-15 mb-3">Personal Details</h5>
                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">First Name</p>
                                                <h6>{sideBar.firstName}</h6>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">Last Name</p>
                                                <h6>{sideBar.lastName}</h6>
                                            </div>


                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">User Name</p>
                                                <h6>{sideBar.username}</h6>
                                            </div>


                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">Phone Number</p>
                                                <h6>{sideBar.phone}</h6>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">Email</p>
                                                <h6>{sideBar.email}</h6>
                                            </div>
                                            <div>
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">Location</p>
                                                <h6 className="mb-0">Mogadishu - SOMALIA</h6>
                                            </div>
                                        </div>
                                        {/* <div className="p-3 border-top">
                                            <h5 className="fs-15 mb-4">File Manager</h5>
                                            <div className="d-flex mb-3">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-danger-subtle text-danger rounded fs-16">
                                                        <i className="ri-image-2-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">Images</Link></h6>
                                                    <p className="text-muted mb-0">4469 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    12 GB
                                                </div>
                                            </div>
                                            <div className="d-flex mb-3">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-secondary-subtle text-secondary rounded fs-16">
                                                        <i className="ri-file-zip-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">Documents</Link></h6>
                                                    <p className="text-muted mb-0">46 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    3.46 GB
                                                </div>
                                            </div>
                                            <div className="d-flex mb-3">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-success-subtle text-success rounded fs-16">
                                                        <i className="ri-live-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">Media</Link></h6>
                                                    <p className="text-muted mb-0">124 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    4.3 GB
                                                </div>
                                            </div>
                                            <div className="d-flex">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-primary-subtle text-primary rounded fs-16">
                                                        <i className="ri-error-warning-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">Others</Link></h6>
                                                    <p className="text-muted mb-0">18 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    846 MB
                                                </div>
                                            </div>
                                        </div> */}
                                    </OffcanvasBody>
                                    {/* <div className="offcanvas-foorter border p-3 hstack gap-3 text-center position-relative">
                                        <button className="btn btn-light w-100"><i className="ri-question-answer-fill align-bottom ms-1"></i> Send Message</button>
                                        <Link to="/pages-profile" className="btn btn-primary w-100"><i className="ri-user-3-fill align-bottom ms-1"></i> View Profile</Link>
                                    </div> */}
                                </Offcanvas>
                            </div>
                            <div className="py-4 mt-4 text-center" id="noresult" style={{ display: "none" }}>
                                <lord-icon src="https://cdn.lordicon.com/msoeawqm.json" trigger="loop" colors="primary:#405189,secondary:#0ab39c" style={{ width: "72px", height: "72px" }}></lord-icon>
                                <h5 className="mt-4">Sorry! No Result Found</h5>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Users;