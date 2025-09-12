import { HotelRoom, Hotel, HotelRoomCategory } from '../models/index.js';
import { Op } from 'sequelize';

// Create hotel room
export const createHotelRoom = async (req, res) => {
  try {
    const { roomNo, hotelId, currentGuestName, status, categoryId } = req.body;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'The specified hotel does not exist'
      });
    }

    // Check if category exists
    const category = await HotelRoomCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The specified room category does not exist'
      });
    }

    // Check if room number already exists for this hotel
    const existingRoom = await HotelRoom.findOne({
      where: {
        roomNo: roomNo.trim(),
        hotelId: hotelId
      }
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        error: 'Room already exists',
        message: 'A room with this number already exists for this hotel'
      });
    }

    const room = await HotelRoom.create({
      roomNo: roomNo.trim(),
      hotelId: hotelId,
      currentGuestName: currentGuestName ? currentGuestName.trim() : null,
      status: status || 'empty',
      categoryId: categoryId
    });

    // Fetch the created room with associations
    const createdRoom = await HotelRoom.findByPk(room.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: HotelRoomCategory,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Hotel room created successfully',
      data: createdRoom
    });
  } catch (error) {
    console.error('Error creating hotel room:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create hotel room'
    });
  }
};

// Get all hotel rooms for a specific hotel
export const getHotelRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { status, categoryId } = req.query;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'The specified hotel does not exist'
      });
    }

    // Build where clause
    const whereClause = { hotelId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const rooms = await HotelRoom.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: HotelRoomCategory,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ],
      order: [['roomNo', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Hotel rooms retrieved successfully',
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching hotel rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch hotel rooms'
    });
  }
};

// Get hotel room by ID
export const getHotelRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await HotelRoom.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: HotelRoomCategory,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
        message: 'The specified hotel room does not exist'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel room retrieved successfully',
      data: room
    });
  } catch (error) {
    console.error('Error fetching hotel room:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch hotel room'
    });
  }
};

// Update hotel room
export const updateHotelRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNo, currentGuestName, status, categoryId } = req.body;

    const room = await HotelRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
        message: 'The specified hotel room does not exist'
      });
    }

    // Check if new room number already exists for this hotel
    if (roomNo && roomNo.trim() !== room.roomNo) {
      const existingRoom = await HotelRoom.findOne({
        where: {
          roomNo: roomNo.trim(),
          hotelId: room.hotelId,
          id: { [Op.ne]: id }
        }
      });

      if (existingRoom) {
        return res.status(409).json({
          success: false,
          error: 'Room already exists',
          message: 'A room with this number already exists for this hotel'
        });
      }
    }

    // Check if category exists (if provided)
    if (categoryId && categoryId !== room.categoryId) {
      const category = await HotelRoomCategory.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          message: 'The specified room category does not exist'
        });
      }
    }

    await room.update({
      roomNo: roomNo ? roomNo.trim() : room.roomNo,
      currentGuestName: currentGuestName !== undefined ? (currentGuestName ? currentGuestName.trim() : null) : room.currentGuestName,
      status: status || room.status,
      categoryId: categoryId || room.categoryId
    });

    // Fetch the updated room with associations
    const updatedRoom = await HotelRoom.findByPk(room.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: HotelRoomCategory,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Hotel room updated successfully',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error updating hotel room:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update hotel room'
    });
  }
};

// Delete hotel room
export const deleteHotelRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await HotelRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
        message: 'The specified hotel room does not exist'
      });
    }

    await room.destroy();

    res.status(200).json({
      success: true,
      message: 'Hotel room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hotel room:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete hotel room'
    });
  }
};
