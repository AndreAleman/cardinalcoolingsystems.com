import { MedusaService } from "@medusajs/framework/utils";
import { Favorite } from "./models";

class FavoriteModuleService extends MedusaService({ Favorite }) {}

export default FavoriteModuleService;
