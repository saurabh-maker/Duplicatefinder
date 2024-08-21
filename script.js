document.getElementById('compare').addEventListener('click', () => {
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    if (!file1 || !file2) {
        alert('Please select both files.');
        return;
    }

    document.getElementById('status').textContent = ' Analyzing both files. Comparison process will be initiated soon. Please await the results.';
    updateProgressBar(0);

    Promise.all([readFile(file1), readFile(file2)])
        .then(([data1, data2]) => {
            const chunkSize = 100; // Process in chunks of 100 rows
            let processedRows = 0;
            const maxRows = Math.max(data1.length, data2.length);
            const differences = [];

            function processChunk(start) {
                const end = Math.min(start + chunkSize, maxRows);
                const chunkData1 = data1.slice(start, end);
                const chunkData2 = data2.slice(start, end);

                differences.push(...compareFiles(chunkData1, chunkData2));
                processedRows = end;

                const progress = Math.round((processedRows / maxRows) * 100);
                updateProgressBar(progress);

                if (processedRows < maxRows) {
                    setTimeout(() => processChunk(processedRows), 0); // Process next chunk
                } else {
                    displayResults(differences);
                    document.getElementById('status').textContent = 'Comparison complete.';
                }
            }

            processChunk(0);
        })
        .catch(error => {
            document.getElementById('status').textContent = 'An error occurred.';
            console.error(error);
        });
});

function updateProgressBar(percentage) {
    const progress = document.getElementById('progress');
    progress.style.width = `${percentage}%`;
    progress.textContent = `${percentage}%`;
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            if (file.name.endsWith('.csv')) {
                resolve(parseCSV(data));
            } else if (file.name.endsWith('.xlsx')) {
                resolve(parseXLSX(data));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

function parseCSV(data) {
    const text = new TextDecoder().decode(data);
    return text.split('\n').map(row => row.split(','));
}

function parseXLSX(data) {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function compareFiles(data1, data2) {
    const differences = [];
    for (let i = 0; i < data1.length; i++) {
        const row1 = data1[i] || [];
        const row2 = data2[i] || [];
        for (let j = 0; j < Math.max(row1.length, row2.length); j++) {
            if (row1[j] !== row2[j]) {
                differences.push({ row: i + 1, col: j + 1, value1: row1[j] || '', value2: row2[j] || '' });
            }
        }
    }
    return differences;
}

function displayResults(results) {
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = `
        <h2>Comparison Results</h2>
        <table>
            <tr>
                <th>Row</th>
                <th>Column</th>
                <th>File 1</th>
                <th>File 2</th>
            </tr>
        </table>
    `;

    const table = resultDiv.querySelector('table');
    results.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${d.row}</td><td>${d.col}</td><td>${d.value1}</td><td>${d.value2}</td>`;
        table.appendChild(row);
    });
}
