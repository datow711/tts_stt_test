// js/db.js

// The 'supabase' object is now globally available thanks to supabaseClient.js

async function loadAllData() {
    try {
        const { data, error } = await supabase
            .from('results')
            .select('cell_id, status');

        if (error) {
            console.error('Error loading data from Supabase:', error);
            throw error;
        }

        // The app expects the format { id: '...', status: '...' }
        // We need to map the 'cell_id' column to 'id'.
        return data.map(item => ({
            id: item.cell_id,
            status: item.status
        }));

    } catch (error) {
        console.error('An unexpected error occurred in loadAllData:', error);
        return []; // Return empty array on failure
    }
}

async function saveData(result) {
    try {
        // Supabase's upsert is perfect for this:
        // It will INSERT a new row if it doesn't exist,
        // or UPDATE the existing one if it does.
        // We need to tell it that 'cell_id' is the column to check for conflicts.
        const { error } = await supabase
            .from('results')
            .upsert({ 
                cell_id: result.id, 
                status: result.status 
            }, {
                onConflict: 'cell_id'
            });

        if (error) {
            console.error('Error saving data to Supabase:', error);
            throw error;
        }
    } catch (error) {
        console.error('An unexpected error occurred in saveData:', error);
    }
}

async function deleteData(cellId) {
    try {
        const { error } = await supabase
            .from('results')
            .delete()
            .eq('cell_id', cellId);

        if (error) {
            console.error('Error deleting data from Supabase:', error);
            throw error;
        }
    } catch (error) {
        console.error('An unexpected error occurred in deleteData:', error);
    }
}

// The initDB function is no longer needed as Supabase handles its own initialization.
// We'll keep an empty function here to avoid breaking the call in app.js for now.
function initDB() {
    // This function is now obsolete.
    console.log("Using Supabase. No local DB initialization needed.");
}
