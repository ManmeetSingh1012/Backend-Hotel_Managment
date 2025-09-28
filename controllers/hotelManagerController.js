import { HotelManager, User, Hotel } from "../models/index.js";
import { Op } from "sequelize";

// Helper function to check if manager has access to specific hotel
export const checkManagerHotelAccess = async (managerId, hotelId) => {
  const assignment = await HotelManager.findOne({
    where: {
      managerId,
      hotelId,
      status: "active",
    },
  });
  return !!assignment;
};

// Helper function to get all active hotel assignments for a manager
export const getManagerActiveAssignments = async (managerId) => {
  return await HotelManager.findAll({
    where: {
      managerId,
      status: "active",
    },
    include: [
      {
        model: Hotel,
        as: "hotel",
        attributes: ["id", "name", "address", "phone", "email"],
      },
    ],
  });
};

// Unassign manager from hotel (admin only)
export const unassignManager = async (req, res) => {
  try {
    const { hotelId, managerId } = req.query;

    // Find the assignment
    const assignment = await HotelManager.findOne({
      where: {
        hotelId,
        id:managerId,
      },
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email", "username"],
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Active assignment not found",
      });
    }

    // Delete the assignment from hotel_managers table
    await HotelManager.destroy({
      where: {
        hotelId,
        id:managerId,
        userId: assignment.manager.id,
      },
    });

    // Delete the manager from users table
    await User.destroy({
      where: {
        id: assignment.manager.id,
        role: "manager",
      },
    });

    res.status(200).json({
      success: true,
      message: "Manager unassigned from hotel and deleted successfully",
      data: {
        deletedManagerId: assignment.id,
        hotelId: hotelId,
      },
    });
  } catch (error) {
    console.error("Error unassigning manager:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get hotel managers by hotelId from params
export const getHotelManagers = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const userRole = req.user.role;
    const userId = req.user.id;

    // Validate hotelId parameter
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    let whereClause = {
      hotelId: hotelId,
    };

    const assignments = await HotelManager.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform data to return only manager details with hotelId
    const managers = assignments.map((assignment) => ({
      id: assignment.id,
      name: assignment.manager.name,
      role: assignment.manager.role,
      email: assignment.manager.email,
      userId: assignment.manager.id,
      hotelId: assignment.hotelId,
    }));

    res.status(200).json({
      success: true,
      message: "Hotel managers retrieved successfully",
      data: managers,
    });
  } catch (error) {
    console.error("Error getting hotel managers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create user and assign as hotel manager
export const createManagerAndAssign = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { name, username, email, password } = req.body;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Create new user with manager role
    const newUser = await User.create({
      name,
      username,
      email,
      password,
      role: "manager",
    });

    // Check if assignment already exists
    const existingAssignment = await HotelManager.findOne({
      where: {
        hotelId,
        userId: newUser.id,
      },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "Manager is already assigned to this hotel",
      });
    }

    // Create new assignment
    const assignment = await HotelManager.create({
      hotelId,
      userId: newUser.id,
      assignedDate: new Date(),
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Manager created and assigned to hotel successfully",
      data: {
        id: assignment.id,
        userId: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        hotelId: hotelId,
      },
    });
  } catch (error) {
    console.error("Error creating manager and assigning:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update assignment status
export const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active/inactive) is required",
      });
    }

    // Find the assignment
    const assignment = await HotelManager.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: "hotel",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Update status
    assignment.status = status;
    if (status === "active") {
      assignment.assignedDate = new Date();
    }
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment status updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error updating assignment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
