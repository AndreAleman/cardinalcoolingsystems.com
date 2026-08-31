import { Module } from "@medusajs/framework/utils";
import FavoriteModuleService from "./service";

export const FAVORITE_MODULE = "favorite";

export default Module(FAVORITE_MODULE, { service: FavoriteModuleService });
