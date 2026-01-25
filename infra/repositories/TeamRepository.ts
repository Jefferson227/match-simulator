const filePath = '../../assets/teams/';

async function getTeam(internalName: string) {
  try {
    const path = `${filePath}${internalName}.json`;
    const response = await fetch(path);

    if (!response.ok) {
      return undefined;
    }

    // Parse the JSON data
    const data = await response.json();

    return data;
  } catch {
    return undefined;
  }
}

// Usage example:
// importDynamicJson('userData').then((data) => {
//   if (data) {
//     console.log('Loaded data:', data);
//   }
// });
