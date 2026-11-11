/**
 * AutoBell Intelligent Geographic Location Resolver
 * Calculates and formats nearest place hierarchy:
 * [Area, City, Province, Country, Continent]
 */

export interface ResolvedLocation {
  area: string
  city: string
  province: string
  country: string
  continent: string
  formatted: string
  shortFormatted: string
}

interface PlaceMeta {
  city: string
  province: string
  country: string
  continent: string
  areas: string[]
}

// Comprehensive Gazetteer Mapping
const PLACES_DATABASE: PlaceMeta[] = [
  // Pakistan - Sindh
  {
    city: 'Karachi',
    province: 'Sindh',
    country: 'Pakistan',
    continent: 'Asia',
    areas: [
      'Saddar', 'Clifton', 'DHA', 'Defence', 'PECHS', 'Gulshan-e-Iqbal', 'Gulshan',
      'Gulistan-e-Jauhar', 'Jauhar', 'Nazimabad', 'North Nazimabad', 'North Karachi',
      'Korangi', 'Landhi', 'Malir', 'Federal B Area', 'FB Area', 'Liaquatabad',
      'Bahria Town', 'SITE', 'Garden', 'Burns Road', 'Tariq Road', 'Shahrah-e-Faisal',
      'Keamari', 'Old City', 'Steel Town', 'Gulberg', 'Mehmoodabad', 'Manzoor Colony',
      'Akhtar Colony', 'Shah Faisal Colony', 'Orangi', 'Baldia', 'Surjani', 'Buffer Zone'
    ]
  },
  {
    city: 'Hyderabad',
    province: 'Sindh',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Latifabad', 'Qasimabad', 'Cantt', 'Saddar', 'Auto Bhan', 'Halanaka', 'Civil Lines']
  },
  {
    city: 'Sukkur',
    province: 'Sindh',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Rohri', 'Military Road', 'Barrage Colony', 'New Sukkur', 'Old Sukkur']
  },
  {
    city: 'Larkana',
    province: 'Sindh',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Vip Road', 'Civil Lines', 'Sachai Colony', 'Resham Gali']
  },

  // Pakistan - Punjab
  {
    city: 'Lahore',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: [
      'Gulberg', 'DHA', 'Defence', 'Model Town', 'Johar Town', 'Cantt', 'Wapda Town',
      'Faisal Town', 'Garden Town', 'Shadman', 'Mall Road', 'Bahria Town', 'Allama Iqbal Town',
      'Iqbal Town', 'Anarkali', 'Mughalpura', 'Raiwind', 'Cavalry Ground', 'Gulshan-e-Ravi',
      'Samanabad', 'Township', 'Valencia', 'Askari', 'Badami Bagh', 'Shalamar'
    ]
  },
  {
    city: 'Rawalpindi',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Saddar', 'Cantt', 'Satellite Town', 'Bahria Town', 'Chaklala', 'Westridge', 'Peshawar Road', 'Adyala', 'Gulzar-e-Quaid', 'Morgah']
  },
  {
    city: 'Faisalabad',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['D Ground', 'Madina Town', 'Peoples Colony', 'Civil Lines', 'Gulberg', 'Ghulam Muhammad Abad', 'Canal Road', 'Jaranwala Road', 'Kohinoor City']
  },
  {
    city: 'Multan',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Cantt', 'Gulgasht Colony', 'Shah Rukn-e-Alam', 'Bosan Road', 'Model Town', 'New Multan', 'Suraj Miani']
  },
  {
    city: 'Gujranwala',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Cantt', 'Model Town', 'Satellite Town', 'Civil Lines', 'Wapda Town', 'Rahwali']
  },
  {
    city: 'Sialkot',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Cantt', 'Model Town', 'Kashmir Road', 'Daska Road', 'Defense', 'Paris Road']
  },
  {
    city: 'Bahawalpur',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Model Town', 'Cantt', 'Farid Gate', 'Satellite Town', 'One Unit']
  },
  {
    city: 'Sargodha',
    province: 'Punjab',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Satellite Town', 'Cantt', 'University Road', 'Farooq Colony', 'Fatima Jinnah Colony']
  },

  // Pakistan - Federal Capital
  {
    city: 'Islamabad',
    province: 'Islamabad Capital Territory',
    country: 'Pakistan',
    continent: 'Asia',
    areas: [
      'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10', 'G-11',
      'I-8', 'I-9', 'I-10', 'H-8', 'H-9', 'E-7', 'E-11', 'Blue Area', 'DHA', 'Bahria Town',
      'Bani Gala', 'Chak Shahzad', 'Sector F', 'Sector G', 'Sector I', 'PWD', 'Soan Gardens'
    ]
  },

  // Pakistan - Khyber Pakhtunkhwa
  {
    city: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Hayatabad', 'University Town', 'Cantt', 'Gulbahar', 'Saddar', 'Warsak Road', 'Ring Road', 'Dalazak Road']
  },
  {
    city: 'Abbottabad',
    province: 'Khyber Pakhtunkhwa',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Mandian', 'Cantt', 'Supply', 'Jinnahabad', 'Kakul', 'Murree Road']
  },
  {
    city: 'Mardan',
    province: 'Khyber Pakhtunkhwa',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Cantt', 'Sheikh Maltoon Town', 'Nowshera Road', 'Baghdada']
  },

  // Pakistan - Balochistan
  {
    city: 'Quetta',
    province: 'Balochistan',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Cantt', 'Satellite Town', 'Jinnah Town', 'Samungli Road', 'Chaman Phatak', 'Zarghoon Road', 'Shahbaz Town']
  },
  {
    city: 'Gwadar',
    province: 'Balochistan',
    country: 'Pakistan',
    continent: 'Asia',
    areas: ['Marine Drive', 'Port Area', 'New Town', 'Singhar']
  },

  // International - Middle East
  {
    city: 'Dubai',
    province: 'Dubai',
    country: 'United Arab Emirates',
    continent: 'Asia',
    areas: ['Deira', 'Bur Dubai', 'Downtown', 'Business Bay', 'Marina', 'Jumeirah', 'Al Barsha', 'Silicon Oasis']
  },
  {
    city: 'Abu Dhabi',
    province: 'Abu Dhabi',
    country: 'United Arab Emirates',
    continent: 'Asia',
    areas: ['Corniche', 'Al Reem Island', 'Yas Island', 'Al Khalidiya', 'Khalifa City']
  },
  {
    city: 'Riyadh',
    province: 'Riyadh Province',
    country: 'Saudi Arabia',
    continent: 'Asia',
    areas: ['Al Olaya', 'Al Malaz', 'Al Nakheel', 'Al Yasmin', 'Diplomatic Quarter']
  },

  // International - Europe & Americas
  {
    city: 'London',
    province: 'Greater London',
    country: 'United Kingdom',
    continent: 'Europe',
    areas: ['Westminster', 'City of London', 'Camden', 'Greenwich', 'Kensington', 'Islington']
  },
  {
    city: 'New York',
    province: 'New York',
    country: 'United States',
    continent: 'North America',
    areas: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']
  }
]

/**
 * Intelligent Algorithm to resolve nearest place & hierarchy
 * Order: Area, City, Province, Country, Continent
 */
export function resolveDeviceLocation(
  device?: {
    location_area?: string | null
    location_city?: string | null
    location_province?: string | null
    location_country?: string | null
    location_continent?: string | null
  } | null,
  school?: {
    address?: string | null
    city?: string | null
    campus_name?: string | null
    name?: string | null
  } | null
): ResolvedLocation {
  // 1. Gather raw hints from device and school
  const rawArea = sanitize(device?.location_area)
  const rawCity = sanitize(device?.location_city || school?.city)
  const rawProvince = sanitize(device?.location_province)
  const rawCountry = sanitize(device?.location_country)
  const rawContinent = sanitize(device?.location_continent)

  const combinedSearchText = [
    rawArea,
    rawCity,
    sanitize(school?.campus_name),
    sanitize(school?.address),
    sanitize(school?.name)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // 2. Search for City and Area in our Places Database
  let matchedPlace: PlaceMeta | null = null
  let matchedArea: string | null = rawArea

  // A. Check if explicit city matches
  if (rawCity) {
    matchedPlace = PLACES_DATABASE.find(
      p => p.city.toLowerCase() === rawCity.toLowerCase()
    ) || null
  }

  // B. Check if text contains a known city name
  if (!matchedPlace) {
    for (const place of PLACES_DATABASE) {
      const cityRegex = new RegExp(`\\b${escapeRegExp(place.city)}\\b`, 'i')
      if (cityRegex.test(combinedSearchText)) {
        matchedPlace = place
        break
      }
    }
  }

  // C. Find matching area within matched place, or anywhere in database
  if (matchedPlace) {
    if (!matchedArea) {
      for (const area of matchedPlace.areas) {
        const areaRegex = new RegExp(`\\b${escapeRegExp(area)}\\b`, 'i')
        if (areaRegex.test(combinedSearchText)) {
          matchedArea = area
          break
        }
      }
    }
  } else {
    // If city wasn't found directly, try finding a unique area
    for (const place of PLACES_DATABASE) {
      for (const area of place.areas) {
        const areaRegex = new RegExp(`\\b${escapeRegExp(area)}\\b`, 'i')
        if (areaRegex.test(combinedSearchText)) {
          matchedPlace = place
          matchedArea = area
          break
        }
      }
      if (matchedPlace) break
    }
  }

  // Fallback area from campus name or first part of address if still empty
  if (!matchedArea) {
    if (school?.campus_name && sanitize(school.campus_name)) {
      matchedArea = sanitize(school.campus_name)
    } else if (school?.address && sanitize(school.address)) {
      const firstToken = sanitize(school.address).split(/[, -]/)[0].trim()
      if (firstToken && firstToken.length > 2 && firstToken.toLowerCase() !== matchedPlace?.city.toLowerCase()) {
        matchedArea = firstToken
      }
    }
  }

  // 3. Assemble components
  const finalCity = matchedPlace?.city || rawCity || (combinedSearchText.includes('karachi') ? 'Karachi' : 'Karachi')
  const finalProvince = matchedPlace?.province || rawProvince || (finalCity.toLowerCase() === 'karachi' ? 'Sindh' : 'Sindh')
  const finalCountry = matchedPlace?.country || rawCountry || 'Pakistan'
  const finalContinent = matchedPlace?.continent || rawContinent || 'Asia'
  const finalArea = matchedArea || rawArea || 'Saddar'

  // Format: Area, City, Province, Country, Continent
  const orderedParts = [
    finalArea,
    finalCity,
    finalProvince,
    finalCountry,
    finalContinent
  ].filter(p => p && p.trim().length > 0 && p.toLowerCase() !== 'null' && p.toLowerCase() !== 'undefined')

  // Deduplicate consecutive identical words
  const deduplicatedParts: string[] = []
  for (const part of orderedParts) {
    if (deduplicatedParts.length === 0 || deduplicatedParts[deduplicatedParts.length - 1].toLowerCase() !== part.toLowerCase()) {
      deduplicatedParts.push(part)
    }
  }

  const formatted = deduplicatedParts.join(', ')
  const shortFormatted = [finalArea, finalCity].filter(Boolean).join(', ')

  return {
    area: finalArea,
    city: finalCity,
    province: finalProvince,
    country: finalCountry,
    continent: finalContinent,
    formatted,
    shortFormatted
  }
}

function sanitize(val?: string | null): string {
  if (!val) return ''
  const trimmed = val.trim()
  if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return ''
  }
  return trimmed
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

