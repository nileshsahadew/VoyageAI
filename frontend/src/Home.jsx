import React from 'react';
import { FaHotel, FaMapMarkedAlt, FaConciergeBell } from 'react-icons/fa';
import './index.css';

export default function Home() {
    return (
        <div className="home-container home-title">
            <h1>Welcome to AuraDrive Resort!</h1>
            <p>Your perfect getaway awaits</p>

            <div className='home-content'>
                <h2>Why Choose Us?</h2>

                <div className="card-container">
                    <div className="card">
                        <FaHotel className="card-icon" />
                        <h3>Luxury Accommodations</h3>
                        <p>Experience world-class rooms with stunning views, premium amenities, and unmatched comfort.</p>
                    </div>
                    <div className="card">
                        <FaMapMarkedAlt className="card-icon" />
                        <h3>Scenic Location</h3>
                        <p>Surrounded by nature, AuraDrive Resort offers a peaceful escape from the hustle and bustle of daily life.</p>
                    </div>
                    <div className="card">
                        <FaConciergeBell className="card-icon" />
                        <h3>Exceptional Service</h3>
                        <p>Our friendly staff is dedicated to ensuring your stay is relaxing, enjoyable, and memorable.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
