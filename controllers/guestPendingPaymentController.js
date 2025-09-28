import { GuestPendingPayment, Hotel, sequelize } from "../models/index.js";
import { Op } from "sequelize";

// Get all pending payments for a specific hotel
export const getPendingPaymentsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    // Validate hotel ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!hotelId || !uuidRegex.test(hotelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid hotel ID format",
        message: "Please provide a valid hotel ID (UUID)",
      });
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid page parameter",
        message: "Page must be a positive integer",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid limit parameter",
        message: "Limit must be a positive integer between 1 and 100",
      });
    }

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
        message: "The specified hotel does not exist",
      });
    }

    // Build where clause for search
    const whereClause = {
      hotelId: hotelId,
    };

    // Add search functionality if search parameter is provided
    if (search && search.trim().length > 0) {
      whereClause[Op.or] = [
        {
          guestName: {
            [Op.iLike]: `%${search.trim()}%`,
          },
        },
      ];
    }

    // Get pending payments for the hotel with pagination
    const { count, rows: pendingPayments } =
      await GuestPendingPayment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Hotel,
            as: "hotel",
            attributes: ["id", "name", "address", "phone"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limitNum,
        offset: offset,
      });

    // Calculate total amounts for all records (not just current page)
    const totalAmountsResult = await GuestPendingPayment.findAll({
      where: whereClause,
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("pendingAmount")),
          "totalPendingAmount",
        ],
        [sequelize.fn("SUM", sequelize.col("totalFood")), "totalFoodAmount"],
        [sequelize.fn("SUM", sequelize.col("rent")), "totalRentAmount"],
        [
          sequelize.fn("SUM", sequelize.col("totalPayment")),
          "totalPaymentAmount",
        ],
      ],
      raw: true,
    });

    const totalPendingAmount = parseFloat(
      totalAmountsResult[0]?.totalPendingAmount || 0
    );
    const totalFoodAmount = parseFloat(
      totalAmountsResult[0]?.totalFoodAmount || 0
    );
    const totalRentAmount = parseFloat(
      totalAmountsResult[0]?.totalRentAmount || 0
    );
    const totalPaymentAmount = parseFloat(
      totalAmountsResult[0]?.totalPaymentAmount || 0
    );

    res.status(200).json({
      success: true,
      message: "Pending payments retrieved successfully",
      data: {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          address: hotel.address,
          phone: hotel.phone,
        },
        pendingPayments: pendingPayments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          totalItems: count,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < Math.ceil(count / limitNum),
          hasPrevPage: pageNum > 1,
        },
        totalPendingAmount: totalPendingAmount,
        totalFoodAmount: totalFoodAmount,
        totalRentAmount: totalRentAmount,
        totalPaymentAmount: totalPaymentAmount,
        searchQuery: search || null,
      },
    });
  } catch (error) {
    console.error("Error getting pending payments by hotel:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to retrieve pending payments",
    });
  }
};

// Create a new pending payment
export const createPendingPayment = async (req, res) => {
  try {
    const {
      hotelId,
      guestName,
      checkinDate,
      checkoutDate,
      pendingAmount,
      totalFood,
      rent,
      totalPayment,
    } = req.body;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
        message: "The specified hotel does not exist",
      });
    }

    // Create pending payment
    const pendingPayment = await GuestPendingPayment.create({
      hotelId,
      guestName,
      checkinDate: checkinDate || null,
      checkoutDate: checkoutDate || null,
      pendingAmount,
      totalFood: totalFood || 0,
      rent: rent || 0,
      totalPayment: totalPayment || 0,
    });

    // Fetch the created payment with hotel details
    const createdPayment = await GuestPendingPayment.findByPk(
      pendingPayment.id,
      {
        include: [
          {
            model: Hotel,
            as: "hotel",
            attributes: ["id", "name", "address", "phone"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Pending payment created successfully",
      data: createdPayment,
    });
  } catch (error) {
    console.error("Error creating pending payment:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to create pending payment",
    });
  }
};

// Update a pending payment
export const updatePendingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotelId,
      guestName,
      checkinDate,
      checkoutDate,
      pendingAmount,
      totalFood,
      rent,
      totalPayment,
    } = req.body;

    // Validate ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
        message: "Please provide a valid ID (UUID)",
      });
    }

    // Check if pending payment exists
    const existingPayment = await GuestPendingPayment.findByPk(id);
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        error: "Pending payment not found",
        message: "The specified pending payment does not exist",
      });
    }

    // If hotelId is being updated, check if the new hotel exists
    if (hotelId && hotelId !== existingPayment.hotelId) {
      const hotel = await Hotel.findByPk(hotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: "Hotel not found",
          message: "The specified hotel does not exist",
        });
      }
    }

    // Update pending payment
    const updateData = {};
    if (hotelId !== undefined) updateData.hotelId = hotelId;
    if (guestName !== undefined) updateData.guestName = guestName;
    if (checkinDate !== undefined) updateData.checkinDate = checkinDate;
    if (checkoutDate !== undefined) updateData.checkoutDate = checkoutDate;
    if (pendingAmount !== undefined) updateData.pendingAmount = pendingAmount;
    if (totalFood !== undefined) updateData.totalFood = totalFood;
    if (rent !== undefined) updateData.rent = rent;
    if (totalPayment !== undefined) updateData.totalPayment = totalPayment;

    await GuestPendingPayment.update(updateData, {
      where: { id: id },
    });

    // Fetch the updated payment with hotel details
    const updatedPayment = await GuestPendingPayment.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: "hotel",
          attributes: ["id", "name", "address", "phone"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Pending payment updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error updating pending payment:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to update pending payment",
    });
  }
};

// Delete a pending payment
export const deletePendingPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
        message: "Please provide a valid ID (UUID)",
      });
    }

    // Check if pending payment exists
    const existingPayment = await GuestPendingPayment.findByPk(id);
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        error: "Pending payment not found",
        message: "The specified pending payment does not exist",
      });
    }

    // Delete pending payment
    await GuestPendingPayment.destroy({
      where: { id: id },
    });

    res.status(200).json({
      success: true,
      message: "Pending payment deleted successfully",
      data: {
        id: id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error deleting pending payment:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to delete pending payment",
    });
  }
};
