import React, { useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    handleClose();
  };
  
  const handleNotificationClick = (notification) => {
    // Mark notification as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.complaintId) {
      navigate(`/complaints/${notification.complaintId}`);
    }
    
    handleClose();
  };
  
  const getNotificationColor = (type) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return '#4caf50'; // Green
      case 'COMMENT':
        return '#2196f3'; // Blue
      case 'ASSIGNMENT':
        return '#ff9800'; // Orange
      default:
        return '#9e9e9e'; // Grey
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350,
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <IconButton size="small" onClick={handleMarkAllAsRead} title="Mark all as read">
              <MarkChatReadIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.isRead ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                display: 'block',
                whiteSpace: 'normal',
                py: 1,
              }}
            >
              <Typography variant="body2" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {format(new Date(notification.sentAt), 'MMM d, h:mm a')}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;