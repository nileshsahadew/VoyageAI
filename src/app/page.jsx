"use client";
import React from "react";
import { FaHotel, FaMapMarkedAlt, FaConciergeBell } from "react-icons/fa";

// Define a style object for all components
const styles = {
  homeContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6", // Light gray background
    color: "#1f2937", // Dark gray text
    fontFamily: "sans-serif",
    padding: "2rem",
  },
  homeTitle: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "bold",
    color: "#4c51bf", // Indigo color
  },
  subtitle: {
    fontSize: "1.25rem",
    color: "#4b5563", // Gray text
  },
  homeContent: {
    width: "100%",
    maxWidth: "1280px",
  },
  contentTitle: {
    fontSize: "2.25rem",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: "2rem",
    color: "#111827", // Darker gray text
  },
  cardContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    maxWidth: "350px",
    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
    // Hover effect cannot be done directly with inline styles, but we can hint at it
  },
  cardIcon: {
    color: "#4c51bf", // Indigo color
    fontSize: "3rem",
    marginBottom: "0.5rem",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "0.5rem",
  },
  cardDescription: {
    fontSize: "0.875rem",
    color: "#4b5563",
  },
};

export default function Home() {
  return (
    <div style={styles.homeContainer}>
      <div style={styles.homeTitle}>
        <h1 style={styles.title}>Welcome to AuraDrive Resort!</h1>
        <p style={styles.subtitle}>Your perfect getaway awaits</p>
      </div>

      <div style={styles.homeContent}>
        <h2 style={styles.contentTitle}>Why Choose Us?</h2>

        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <FaHotel style={styles.cardIcon} />
            <h3 style={styles.cardTitle}>Luxury Accommodations</h3>
            <p style={styles.cardDescription}>
              Experience world-class rooms with stunning views, premium
              amenities, and unmatched comfort.
            </p>
          </div>
          <div style={styles.card}>
            <FaMapMarkedAlt style={styles.cardIcon} />
            <h3 style={styles.cardTitle}>Scenic Location</h3>
            <p style={styles.cardDescription}>
              Surrounded by nature, AuraDrive Resort offers a peaceful escape
              from the hustle and bustle of daily life.
            </p>
          </div>
          <div style={styles.card}>
            <FaConciergeBell style={styles.cardIcon} />
            <h3 style={styles.cardTitle}>Exceptional Service</h3>
            <p style={styles.cardDescription}>
              Our friendly staff is dedicated to ensuring your stay is relaxing,
              enjoyable, and memorable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
