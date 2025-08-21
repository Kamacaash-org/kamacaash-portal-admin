export const validateUniversityData = (data) => {
    const errors = [];

    // Validate university info
    if (!data.universityInfo.name) {
        errors.push('University name is required');
    }

    // Validate whySimad data
    if (data.whySimadData && Array.isArray(data.whySimadData)) {
        data.whySimadData.forEach((item, index) => {
            if (!item.title) errors.push(`Why SIMAD item ${index + 1}: Title is required`);
            if (!item.description) errors.push(`Why SIMAD item ${index + 1}: Description is required`);
        });
    }

    // Validate history data
    if (data.historyData && Array.isArray(data.historyData)) {
        data.historyData.forEach((item, index) => {
            if (!item.year) errors.push(`History item ${index + 1}: Year is required`);
            if (!item.events || !Array.isArray(item.events) || item.events.length === 0) {
                errors.push(`History item ${index + 1}: At least one event is required`);
            } else {
                item.events.forEach((event, eventIndex) => {
                    if (!event.trim()) errors.push(`History item ${index + 1}, Event ${eventIndex + 1}: Event description is required`);
                });
            }
        });
    }

    // Validate senate members
    if (data.senateMembers && Array.isArray(data.senateMembers)) {
        data.senateMembers.forEach((member, index) => {
            if (!member.name) errors.push(`Senate member ${index + 1}: Name is required`);
            if (!member.position) errors.push(`Senate member ${index + 1}: Position is required`);
        });
    }

    // Validate accreditations
    if (data.accreditations && Array.isArray(data.accreditations)) {
        data.accreditations.forEach((accreditation, index) => {
            if (!accreditation.name) errors.push(`Accreditation ${index + 1}: Name is required`);
            if (!accreditation.validity) errors.push(`Accreditation ${index + 1}: Validity is required`);
        });
    }

    return errors;
};