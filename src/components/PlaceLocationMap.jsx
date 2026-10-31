import React,{useEffect,useState} from 'react';
import {MapContainer,TileLayer,Marker,useMap,useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const icon=L.divIcon({className:'rr-place-pin',html:'<span></span>',iconSize:[26,26],iconAnchor:[13,13]});
function Events({onChange,disabled}){useMapEvents({click:e=>!disabled&&onChange({lat:e.latlng.lat,lng:e.latlng.lng}),moveend:e=>{if(disabled)return;const c=e.target.getCenter();onChange({lat:c.lat,lng:c.lng});}});return null;}
function Center({point}){const map=useMap();useEffect(()=>{if(map.getCenter().distanceTo([point.lat,point.lng])>1)map.panTo([point.lat,point.lng],{animate:false});},[map,point.lat,point.lng]);return null;}
function Lock({disabled}){const map=useMap();useEffect(()=>{for(const control of [map.dragging,map.keyboard,map.touchZoom,map.doubleClickZoom,map.boxZoom]){if(disabled)control.disable();else control.enable();}},[map,disabled]);return null;}
export default function PlaceLocationMap({point,onChange,disabled}){
 const [tileError,setTileError]=useState(false);
 return <><MapContainer center={[point.lat,point.lng]} zoom={17} className="rr-place-location-map" scrollWheelZoom={false}>
  <TileLayer eventHandlers={{tileerror:()=>setTileError(true),tileload:()=>setTileError(false)}} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'/>
  <Marker position={[point.lat,point.lng]} icon={icon} draggable={!disabled} eventHandlers={{dragend:e=>{const c=e.target.getLatLng();onChange({lat:c.lat,lng:c.lng});}}}/>
  <Center point={point}/><Events onChange={onChange} disabled={disabled}/><Lock disabled={disabled}/>
 </MapContainer>{tileError&&<p role="status" className="field-help">O fundo do mapa não carregou. Tente com conexão ou cancele para informar a localização manualmente.</p>}</>;
}
