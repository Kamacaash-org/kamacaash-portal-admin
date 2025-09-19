import React from "react";
import { Col } from "reactstrap";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Link } from "react-router-dom";

// Import Images
import logoLight from "../../assets/images/logo-kamacash.png";

const AuthSlider = () => {
    return (
        <React.Fragment>

            <Col lg={6}>
                <div className="p-lg-5 p-1 auth-one-bg h-100">
                    <div className="bg-overlay"></div>
                    <div className="position-relative h-100 d-flex flex-column">
                        <div className="pl-5">
                            {/* <Link to="/dashboard" className="d-block">
                                <img src={logoLight} alt="" height="88" />
                            </Link> */}
                            <span className="logo-lg">
                                <span
                                    style={{
                                        height: '50px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        // overflow: 'hidden',
                                        // boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                                        marginTop: '22px',
                                        // marginBottom: '50px'
                                    }}
                                >
                                    <div className="col-auto">
                                        <div className="avatar-lg">
                                            <img src={logoLight} alt="user-img"
                                                className="img-thumbnail rounded-circle" />
                                        </div>
                                    </div>
                                </span> </span>
                        </div>
                        <div className="mt-auto">
                            <div className="mb-3">
                                <i className="ri-double-quotes-l display-4 text-success"></i>
                            </div>

                            <Carousel showThumbs={false} autoPlay={true} showArrows={false} showStatus={false} infiniteLoop={true} className="slide" id="qoutescarouselIndicators">
                                <div className="carousel-inner text-center text-white-50 pb-5">
                                    <div className="item">
                                        <p className="fs-15 fst-italic">" Our university system provides seamless access to student records, courses, and faculty resources. "</p>                                    </div>
                                </div>
                                <div className="carousel-inner text-center text-white-50 pb-5">
                                    <div className="item">
                                        <p className="fs-15 fst-italic">" The platform ensures smooth communication between students, professors, and administration. "</p>                                    </div>
                                </div>
                                <div className="carousel-inner text-center text-white-50 pb-5">
                                    <div className="item">
                                        <p className="fs-15 fst-italic">" Easy to navigate, secure, and designed for academic excellence. "</p>                                    </div>
                                </div>
                            </Carousel>

                        </div>
                    </div>
                </div>
            </Col>
        </React.Fragment >
    );
};

export default AuthSlider;