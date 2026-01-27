"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

import { getToken } from "../../../helpers/authUtils";

// ... (imports)

export default function CalendarWidget() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const token = getToken();
        fetch('/api/admin/analytics?type=calendar', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                if (res.success && Array.isArray(res.data.analytics)) {
                    const formattedEvents = res.data.analytics.map(ev => ({
                        ...ev,
                        start: new Date(ev.start),
                        end: new Date(ev.end),
                        title: ev.title
                    }));
                    setEvents(formattedEvents);
                }
            })
            .catch(console.error);
    }, []);

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        if (event.status === 'confirmed') backgroundColor = '#10b981';
        if (event.status === 'pending') backgroundColor = '#f59e0b';
        if (event.status === 'cancelled') backgroundColor = '#ef4444';

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[600px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Calendar</h3>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day']}
            />
        </div>
    );
}
